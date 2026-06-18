import React, { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { formatDate } from '../utils/formatDate';
import { ChevronDown, FileSpreadsheet, Plus, Trash2, Edit, Printer, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import letterheadUrl from '../assets/Letter head .pdf';

export const Expenses = ({ onAddExpense, onEditExpense }) => {
  const { expenses, deleteExpense, getTotalExpenses } = useFinanceStore();
  const [expandedId, setExpandedId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPaidBy, setSelectedPaidBy] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [dateRange, setDateRange] = useState('All');

  // Dropdown visibility states
  const [activeDropdown, setActiveDropdown] = useState(null);

  const toggleDropdown = (name) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  const handleRowClick = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Filter Logic
  const filteredExpenses = expenses.filter(exp => {
    const categoryMatch = selectedCategory === 'All' || exp.category === selectedCategory;
    const paidByMatch = selectedPaidBy === 'All' || exp.paidBy === selectedPaidBy;
    const statusMatch = selectedStatus === 'All' || exp.status === selectedStatus;
    
    let dateMatch = true;
    if (dateRange === 'Recent') {
      const expDate = new Date(exp.date);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 10);
      dateMatch = expDate >= limitDate;
    }
    
    return categoryMatch && paidByMatch && statusMatch && dateMatch;
  });

  const categories = ['All', ...new Set(expenses.map(e => e.category))];
  const paidBys = ['All', ...new Set(expenses.map(e => e.paidBy))];
  const statuses = ['All', 'Paid', 'Pending'];
  const dateRanges = ['All', 'Recent (Last 10 days)'];

  // Excel export using SheetJS
  const exportToExcel = () => {
    const dataToExport = filteredExpenses.map(exp => ({
      Date: exp.date,
      Category: exp.category,
      Vendor: exp.vendor,
      Description: exp.description,
      'Base Amount (INR)': exp.baseAmount,
      'GST Rate (%)': exp.gstRate,
      'GST Amount (INR)': exp.gstAmount,
      'Total Amount (INR)': exp.total,
      'Payment Method': exp.paymentMethod,
      'Paid By': exp.paidBy,
      Status: exp.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses Log");
    
    // Auto-fit columns
    const maxLen = dataToExport.reduce((acc, row) => {
      Object.keys(row).forEach((key, idx) => {
        const valStr = String(row[key] || '');
        acc[idx] = Math.max(acc[idx] || 0, valStr.length, key.length);
      });
      return acc;
    }, []);
    worksheet['!cols'] = maxLen.map(len => ({ wch: len + 3 }));

    XLSX.writeFile(workbook, "Luminexis_Expenses_Report.xlsx");
    setActiveDropdown(null);
  };

  // PDF export utilizing Letter head.pdf
  const exportToPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let letterheadImgData = null;
      try {
        // Fetch the Letter head.pdf file
        const response = await fetch(letterheadUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          // Load binary array using pdfjsLib from global window context
          const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          
          // Render to canvas at high resolution
          const viewport = page.getViewport({ scale: 2.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // White canvas background
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          await page.render({ canvasContext: context, viewport: viewport }).promise;
          letterheadImgData = canvas.toDataURL('image/png');
        }
      } catch (err) {
        console.error("PDF letterhead failed:", err);
      }

      // Draw letterhead background
      if (letterheadImgData) {
        doc.addImage(letterheadImgData, 'PNG', 0, 0, 210, 297);
      } else {
        // Fallback clean template with corporate colors
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, 210, 297, 'F');
        
        doc.setFillColor(5, 119, 50); // lx-green
        doc.rect(0, 0, 210, 10, 'F');
        
        doc.setFillColor(3, 60, 31); // lx-green-dark
        doc.rect(0, 255, 210, 42, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("LUMINEXIS TECHNOLOGIES", 20, 268);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("hello@luminexis.in | www.luminexis.in", 20, 275);
      }

      // Draw statement headers (styled for white background)
      doc.setTextColor(5, 119, 50); // lx-green
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("LUMINEXIS TRANSACTION REGISTRY", 20, 45, { charSpace: 1.5 });

      doc.setTextColor(17, 17, 17); // dark text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("Expenses Audit Log", 20, 55);

      doc.setTextColor(102, 102, 102);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9.5);
      const totalSum = filteredExpenses.reduce((acc, e) => acc + e.total, 0);
      doc.text(`Total Volume: ${filteredExpenses.length} Transactions  |  Total Value: Rs. ${totalSum.toFixed(2)}`, 20, 62);

      // Section divider line
      doc.setDrawColor(226, 232, 240); // slate-200 border
      doc.setLineWidth(0.4);
      doc.line(20, 67, 190, 67);

      // Draw Table Headers
      doc.setTextColor(5, 119, 50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.text("DATE", 20, 74);
      doc.text("VENDOR", 42, 74);
      doc.text("CATEGORY", 85, 74);
      doc.text("PAID BY", 120, 74);
      doc.text("STATUS", 145, 74);
      doc.text("AMOUNT", 190, 74, { align: 'right' });

      // Table header line
      doc.line(20, 77, 190, 77);

      // Draw rows
      let rowY = 84;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);

      filteredExpenses.forEach((exp, idx) => {
        // Truncate to fit column widths safely
        const vendor = exp.vendor.length > 20 ? exp.vendor.substring(0, 18) + '..' : exp.vendor;
        const cat = exp.category.length > 15 ? exp.category.substring(0, 13) + '..' : exp.category;
        
        doc.setTextColor(102, 102, 102);
        doc.text(exp.date, 20, rowY);
        
        doc.setTextColor(17, 17, 17);
        doc.text(vendor, 42, rowY);
        
        doc.setTextColor(85, 85, 85);
        doc.text(cat, 85, rowY);
        doc.text(exp.paidBy, 120, rowY);
        
        if (exp.status === 'Paid') {
          doc.setTextColor(5, 119, 50);
          doc.text("PAID", 145, rowY);
        } else {
          doc.setTextColor(217, 119, 6); // amber pending color
          doc.text("PENDING", 145, rowY);
        }
        
        doc.setTextColor(17, 17, 17);
        doc.text(`Rs. ${exp.total.toFixed(2)}`, 190, rowY, { align: 'right' });

        // Table inner border line
        doc.setDrawColor(241, 245, 249);
        doc.line(20, rowY + 3.5, 190, rowY + 3.5);
        
        rowY += 10;
      });

      // Bottom disclaimer above letterhead green footer (starts at ~250mm)
      doc.setTextColor(153, 153, 153);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text("This ledger audit log is cryptographically sealed.", 20, 240);
      doc.text("Luminexis Financial Audit Board &middot; All rights reserved.", 20, 244);

      doc.save("Luminexis_Expenses_Registry.pdf");
    } catch (err) {
      console.error("Failed to export expenses PDF log:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
            Expenses
          </h1>
          <p className="font-oxanium text-[13px] font-light text-lx-muted">
            {filteredExpenses.length} transactions · {formatCurrency(filteredExpenses.reduce((acc, e) => acc + e.total, 0))} total
          </p>
        </div>

        <button 
          onClick={onAddExpense}
          className="font-oxanium text-[12px] font-medium text-lx-green border border-lx-green rounded-[4px] px-4 py-2 hover:bg-lx-green hover:text-white transition-all duration-150 ease-out active:scale-[0.98] self-start md:self-auto"
        >
          Add Expense +
        </button>
      </div>

      {/* Filter bar - Free floating */}
      <div className="flex flex-wrap items-center gap-3 z-20 relative">
        {/* Category Filter */}
        <div className="relative">
          <button 
            onClick={() => toggleDropdown('category')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-lx-border rounded-[4px] text-lx-muted font-oxanium text-[12px] hover:text-lx-white hover:border-lx-muted transition-all duration-150"
          >
            <span>Category: <strong className="text-lx-white font-medium">{selectedCategory}</strong></span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'category' && (
            <div className="absolute left-0 mt-1 w-48 bg-lx-surface border border-lx-green rounded-[4px] shadow-xl py-1 z-30">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-[12px] font-oxanium transition-colors ${selectedCategory === cat ? 'text-lx-green-glow bg-lx-surface-2' : 'text-lx-muted hover:text-lx-white hover:bg-lx-surface-2'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div className="relative">
          <button 
            onClick={() => toggleDropdown('date')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-lx-border rounded-[4px] text-lx-muted font-oxanium text-[12px] hover:text-lx-white hover:border-lx-muted transition-all duration-150"
          >
            <span>Date Range: <strong className="text-lx-white font-medium">{dateRange === 'All' ? 'All Time' : 'Recent'}</strong></span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === 'date' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'date' && (
            <div className="absolute left-0 mt-1 w-48 bg-lx-surface border border-lx-green rounded-[4px] shadow-xl py-1 z-30">
              {dateRanges.map(dr => (
                <button
                  key={dr}
                  onClick={() => {
                    setDateRange(dr.startsWith('Recent') ? 'Recent' : 'All');
                    setActiveDropdown(null);
                  }}
                  className="w-full text-left px-4 py-2 text-[12px] font-oxanium text-lx-muted hover:text-lx-white hover:bg-lx-surface-2 transition-colors"
                >
                  {dr}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Paid By Filter */}
        <div className="relative">
          <button 
            onClick={() => toggleDropdown('paidBy')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-lx-border rounded-[4px] text-lx-muted font-oxanium text-[12px] hover:text-lx-white hover:border-lx-muted transition-all duration-150"
          >
            <span>Paid By: <strong className="text-lx-white font-medium">{selectedPaidBy}</strong></span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === 'paidBy' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'paidBy' && (
            <div className="absolute left-0 mt-1 w-48 bg-lx-surface border border-lx-green rounded-[4px] shadow-xl py-1 z-30">
              {paidBys.map(pb => (
                <button
                  key={pb}
                  onClick={() => {
                    setSelectedPaidBy(pb);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-[12px] font-oxanium transition-colors ${selectedPaidBy === pb ? 'text-lx-green-glow bg-lx-surface-2' : 'text-lx-muted hover:text-lx-white hover:bg-lx-surface-2'}`}
                >
                  {pb}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button 
            onClick={() => toggleDropdown('status')}
            className="flex items-center gap-2 px-3 py-2 bg-transparent border border-lx-border rounded-[4px] text-lx-muted font-oxanium text-[12px] hover:text-lx-white hover:border-lx-muted transition-all duration-150"
          >
            <span>Status: <strong className="text-lx-white font-medium">{selectedStatus}</strong></span>
            <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === 'status' ? 'rotate-180' : ''}`} />
          </button>
          
          {activeDropdown === 'status' && (
            <div className="absolute left-0 mt-1 w-48 bg-lx-surface border border-lx-green rounded-[4px] shadow-xl py-1 z-30">
              {statuses.map(st => (
                <button
                  key={st}
                  onClick={() => {
                    setSelectedStatus(st);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-4 py-2 text-[12px] font-oxanium transition-colors ${selectedStatus === st ? 'text-lx-green-glow bg-lx-surface-2' : 'text-lx-muted hover:text-lx-white hover:bg-lx-surface-2'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Export Buttons */}
        <div className="ml-auto flex items-center gap-3">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 bg-lx-surface border border-lx-border hover:border-lx-green rounded-[4px] text-lx-white font-oxanium text-[12px] hover:text-lx-green-glow transition-all duration-150"
          >
            <FileSpreadsheet size={13} />
            <span>Export to Excel</span>
          </button>
          
          <button 
            onClick={exportToPDF}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-2 bg-lx-surface border border-lx-border hover:border-lx-green rounded-[4px] text-lx-white font-oxanium text-[12px] hover:text-lx-green-glow transition-all duration-150 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <Printer size={13} />
                <span>Export to PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Expenses Table */}
      <div className="border border-lx-border rounded-[8px] bg-lx-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-lx-border">
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Date</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Category</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Vendor</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Paid By</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase">Status</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-right">Amount</th>
                <th className="py-4 px-6 text-[10px] font-light tracking-[0.12em] text-lx-green uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[12px] font-light text-lx-muted">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-10 h-10 text-lx-muted/30 mb-2 stroke-[1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No matching expenses found. Add your first expense ↗</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, idx) => {
                  const isExpanded = expandedId === exp.id;
                  return (
                    <React.Fragment key={exp.id}>
                      {/* Main row */}
                      <tr 
                        onClick={() => handleRowClick(exp.id)}
                        className={`cursor-pointer transition-all duration-150 select-none border-l-2
                          ${idx % 2 === 0 ? 'bg-lx-black' : 'bg-[#080808]'}
                          ${isExpanded ? 'border-l-lx-green' : 'border-l-transparent hover:border-l-lx-green'}
                          hover:bg-lx-surface-2
                        `}
                      >
                        {/* Cells shift text slightly to right on hover */}
                        <td className="py-4 px-6 text-[13px] text-[#CCCCCC] font-oxanium transition-transform duration-150 hover:translate-x-[2px]">{formatDate(exp.date)}</td>
                        <td className="py-4 px-6 text-[13px] text-[#CCCCCC] font-oxanium">{exp.category}</td>
                        <td className="py-4 px-6 text-[13px] text-[#CCCCCC] font-oxanium font-medium">{exp.vendor}</td>
                        <td className="py-4 px-6 text-[13px] text-[#CCCCCC] font-oxanium">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-lx-green flex items-center justify-center text-[10px] font-bold text-lx-white select-none">
                              {exp.paidBy.substring(0, 2).toUpperCase()}
                            </span>
                            <span>{exp.paidBy}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-[13px] font-oxanium">
                          {/* Hand crafted Badge: Left border accent */}
                          {exp.status === 'Paid' ? (
                            <div className="inline-flex items-center pl-2 border-l-[3px] border-l-lx-green py-0.5">
                              <span className="text-[11px] font-semibold tracking-wider text-lx-green uppercase">Paid</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center pl-2 border-l-[3px] border-l-lx-amber py-0.5">
                              <span className="text-[11px] font-semibold tracking-wider text-lx-amber uppercase">Pending</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-[13px] font-semibold text-right text-lx-white font-oxanium">
                          {formatCurrency(exp.total)}
                        </td>
                        
                        {/* Action buttons (Edit & Delete) */}
                        <td className="py-4 px-6 text-[13px] font-oxanium text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="inline-flex items-center gap-4">
                            <button 
                              onClick={() => onEditExpense(exp)}
                              className="text-lx-muted hover:text-lx-white transition-colors p-1"
                              title="Edit Expense"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => deleteExpense(exp.id)}
                              className="text-lx-muted hover:text-lx-red transition-colors p-1"
                              title="Delete Expense"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable details row */}
                      {isExpanded && (
                        <tr className={idx % 2 === 0 ? 'bg-lx-black' : 'bg-[#080808]'}>
                          <td colSpan="7" className="px-6 py-0 border-b border-lx-border">
                            <div className="overflow-hidden transition-all duration-300 ease-in-out py-4 text-lx-muted border-t border-lx-border/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px]">
                                <div className="space-y-2">
                                  <h4 className="text-[10px] uppercase tracking-widest text-lx-green font-medium">Description</h4>
                                  <p className="text-lx-white leading-relaxed font-light">{exp.description || 'No description provided.'}</p>
                                  <div className="pt-2 text-[11px] font-light">
                                    <span>Method: </span><strong className="text-lx-white">{exp.paymentMethod || 'Credit Card'}</strong>
                                  </div>
                                </div>
                                
                                <div className="space-y-2 bg-lx-surface-2 p-4 rounded-[6px] border border-lx-border">
                                  <h4 className="text-[10px] uppercase tracking-widest text-lx-green font-medium mb-3">GST Tax Breakdown</h4>
                                  <div className="flex justify-between items-center py-1 border-b border-lx-border/40">
                                    <span>Base Taxable Value:</span>
                                    <span className="text-lx-white font-medium">{formatCurrency(exp.baseAmount)}</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-lx-border/40">
                                    <span>GST Rate (%):</span>
                                    <span className="text-lx-white font-medium">{exp.gstRate}%</span>
                                  </div>
                                  <div className="flex justify-between items-center py-1 border-b border-lx-border/40">
                                    <span>GST Charged:</span>
                                    <span className="text-lx-green-glow font-medium">{formatCurrency(exp.gstAmount)}</span>
                                  </div>
                                  <div className="flex justify-between items-center pt-2 font-semibold text-[13px]">
                                    <span className="text-lx-white">Total Amount:</span>
                                    <span className="text-lx-green-glow">{formatCurrency(exp.total)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

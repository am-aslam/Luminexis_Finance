import React, { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { formatCurrency } from '../utils/formatCurrency';
import { jsPDF } from 'jspdf';
import { Printer, Loader2 } from 'lucide-react';
import letterheadUrl from '../assets/Letter head .pdf';

export const Reports = () => {
  const { 
    expenses,
    getTotalCapital, 
    getTotalExpenses, 
    getTotalIncome, 
    getCurrentBalance 
  } = useFinanceStore();

  const [isGenerating, setIsGenerating] = useState(false);

  // Compute category spending data
  const totalSpend = getTotalExpenses();
  const categoryMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.total;
    return acc;
  }, {});

  const categoriesData = Object.entries(categoryMap)
    .map(([name, value]) => ({
      name,
      value,
      percentage: totalSpend > 0 ? (value / totalSpend) * 100 : 0
    }))
    .sort((a, b) => b.value - a.value);

  // PDF Export utilizing the imported Letter head.pdf
  const handleExportPDF = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      let letterheadImgData = null;
      
      try {
        // 1. Fetch the Letter head.pdf file
        const response = await fetch(letterheadUrl);
        if (!response.ok) throw new Error("Failed to fetch letterhead pdf file");
        const arrayBuffer = await response.arrayBuffer();

        // 2. Load the binary array data via PDF.js library (defined globally on index.html)
        const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        // 3. Render page to a canvas at a high resolution (scale 2.5x for crisp vectors)
        const viewport = page.getViewport({ scale: 2.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // White canvas background
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;

        letterheadImgData = canvas.toDataURL('image/png');
      } catch (err) {
        console.error("PDF.js letterhead render failed, falling back to corporate design: ", err);
      }

      // Draw background letterhead if rendering succeeded
      if (letterheadImgData) {
        doc.addImage(letterheadImgData, 'PNG', 0, 0, 210, 297);
      } else {
        // Fallback: A4 clean layout with green headers and footer matching corporate letterhead
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

      // Overlay Content (Styled for white background printing)
      
      // Upper Label
      doc.setTextColor(5, 119, 50); // lx-green
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("LUMINEXIS LEDGER TRANSCRIPT", 20, 45, { charSpace: 1.5 });

      // Title
      doc.setTextColor(17, 17, 17); // Dark primary text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(24);
      doc.text("Monthly Financial Statement", 20, 56);

      // Sub-line
      doc.setTextColor(102, 102, 102);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Statement Period: June 2026  |  Report Generated: ${new Date().toLocaleDateString('en-IN')}`, 20, 63);

      // Section line
      doc.setDrawColor(226, 232, 240); // slate-200 border
      doc.setLineWidth(0.4);
      doc.line(20, 68, 190, 68);

      // Left Column: Summary Metrics Stacks
      let metricY = 82;
      const drawMetricStack = (label, valStr) => {
        doc.setTextColor(102, 102, 102);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(label.toUpperCase(), 20, metricY);
        
        doc.setTextColor(17, 17, 17);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(18);
        doc.text(valStr, 20, metricY + 8);
        
        doc.setDrawColor(241, 245, 249);
        doc.line(20, metricY + 13, 95, metricY + 13);
        metricY += 24;
      };

      drawMetricStack("Total Capital Injected", formatCurrency(getTotalCapital()));
      drawMetricStack("Total Gross Revenue", formatCurrency(getTotalIncome()));
      drawMetricStack("Total Expenses", formatCurrency(getTotalExpenses()));
      drawMetricStack("Liquid Bank Balance", formatCurrency(getCurrentBalance()));

      // Right Column: Spending Categories (Custom Horizontal Chart)
      doc.setTextColor(5, 119, 50);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.text("SPENDING BY CATEGORY", 115, 82);

      let catY = 92;
      categoriesData.forEach(cat => {
        // Name
        doc.setTextColor(85, 85, 85);
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(cat.name, 115, catY);

        // Amount (Right aligned)
        doc.setTextColor(17, 17, 17);
        doc.text(formatCurrency(cat.value), 190, catY, { align: 'right' });

        // Bar Track background
        doc.setFillColor(241, 245, 249);
        doc.rect(115, catY + 2.5, 75, 2.5, 'F');

        // Bar fill green
        doc.setFillColor(5, 119, 50);
        const fillW = (cat.percentage / 100) * 75;
        doc.rect(115, catY + 2.5, fillW, 2.5, 'F');

        catY += 15;
      });

      // Bottom disclaimer above letterhead green footer (starts at ~250mm)
      doc.setTextColor(153, 153, 153);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text("This document is a certified copy of the Luminexis Ledger.", 20, 240);
      doc.text("All transactions have cleared authentication parameters.", 20, 244);

      doc.save("Luminexis_June_2026_Statement.pdf");
    } catch (err) {
      console.error("Failed to generate report PDF", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Page Headline Section */}
      <div className="space-y-2 select-none border-b border-lx-border pb-6">
        <span className="brand-logo text-[11px] font-normal tracking-[0.25em] text-lx-green-glow block">
          LUMINEXIS
        </span>
        <h1 className="font-oxanium text-3xl md:text-[36px] font-extrabold text-lx-white tracking-tight leading-none">
          Monthly Financial Statement
        </h1>
        <p className="font-oxanium text-sm font-light text-lx-muted">
          All-Time Summary &middot; June 2026
        </p>
      </div>

      {/* Two-Column split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Left Column (Wider Metric Stack) */}
        <div className="space-y-8 select-none">
          {/* Capital Injected */}
          <div className="pb-6 border-b border-lx-border">
            <span className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-[0.2em] block mb-2">
              Total Capital Injected
            </span>
            <span className="font-oxanium text-4xl font-extrabold text-lx-white">
              {formatCurrency(getTotalCapital())}
            </span>
          </div>

          {/* Revenue */}
          <div className="pb-6 border-b border-lx-border">
            <span className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-[0.2em] block mb-2">
              Total Gross Revenue
            </span>
            <span className="font-oxanium text-4xl font-extrabold text-lx-white">
              {formatCurrency(getTotalIncome())}
            </span>
          </div>

          {/* Expenses */}
          <div className="pb-6 border-b border-lx-border">
            <span className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-[0.2em] block mb-2">
              Total Expenses
            </span>
            <span className="font-oxanium text-4xl font-extrabold text-lx-white">
              {formatCurrency(getTotalExpenses())}
            </span>
          </div>

          {/* Balance */}
          <div className="pb-6 border-b border-lx-border">
            <span className="font-oxanium text-[10px] font-light text-lx-green uppercase tracking-[0.2em] block mb-2">
              Liquid Bank Balance
            </span>
            <span className="font-oxanium text-4xl font-extrabold text-lx-white">
              {formatCurrency(getCurrentBalance())}
            </span>
          </div>
        </div>

        {/* Right Column: Expense Category Chart */}
        <div className="space-y-8">
          <div className="border-b border-lx-border pb-4">
            <span className="editorial-label block tracking-[0.2em] font-light text-[10px] select-none">
              Spending Breakdown
            </span>
          </div>

          <div className="space-y-6">
            {categoriesData.length === 0 ? (
              <p className="text-lx-muted text-[12px] font-light py-12 text-center">No transactions recorded.</p>
            ) : (
              categoriesData.map(cat => (
                <div key={cat.name} className="space-y-2 select-none">
                  <div className="flex items-center justify-between text-[12px] font-oxanium">
                    <span className="text-lx-muted font-medium">{cat.name}</span>
                    <span className="text-lx-white font-semibold">{formatCurrency(cat.value)}</span>
                  </div>
                  {/* Custom progress bar */}
                  <div className="h-[5px] bg-lx-surface-2 rounded-full overflow-hidden">
                    <div 
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-lx-green rounded-full"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Print / PDF Export Button */}
      <div className="pt-8">
        <button 
          onClick={handleExportPDF}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-3 py-4 border border-lx-border hover:border-lx-green rounded-[4px] text-lx-muted hover:text-lx-green-glow font-oxanium text-[13px] font-medium tracking-wider uppercase transition-all duration-150 active:scale-[0.99] select-none disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Generating Statement...</span>
            </>
          ) : (
            <>
              <Printer size={15} />
              <span>Export Financial Statement (PDF)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

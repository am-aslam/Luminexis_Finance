import React, { useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { Mail, Trash2, Copy, Check } from 'lucide-react';

export const Settings = () => {
  const user = useFinanceStore((state) => state.user);
  const invitations = useFinanceStore((state) => state.invitations);
  const inviteCoFounder = useFinanceStore((state) => state.inviteCoFounder);
  const revokeInvitation = useFinanceStore((state) => state.revokeInvitation);
  const resetDatabase = useFinanceStore((state) => state.resetDatabase);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('CO_FOUNDER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!inviteEmail) return;

    try {
      setIsLoading(true);
      const invite = await inviteCoFounder(inviteEmail);
      setSuccess(`Invitation successfully generated for ${inviteEmail}!`);
      setInviteEmail('');
    } catch (err) {
      setError(err.message || 'Failed to send invitation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (invite) => {
    const inviteUrl = `http://localhost:5173/signup?token=${invite.token}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedId(invite.id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const handleRevoke = async (id) => {
    if (!confirm('Are you sure you want to revoke this invitation?')) return;
    try {
      await revokeInvitation(id);
    } catch (err) {
      alert(err.message || 'Failed to revoke invitation.');
    }
  };

  const handleReset = async () => {
    if (!confirm('WARNING: This will wipe all user accounts, transactions, expenses, incomes, and ledger balances. You will be logged out. Do you want to proceed?')) return;
    try {
      await resetDatabase();
      window.location.reload();
    } catch (err) {
      alert('Reset failed: ' + err.message);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'AA';

  const formatRole = (role) => {
    if (role === 'FOUNDER') return 'Founder';
    if (role === 'CO_FOUNDER') return 'Co-founder';
    if (role === 'ADMIN') return 'Admin';
    return role;
  };

  return (
    <div className="space-y-8 select-none">
      {/* Header */}
      <div className="border-b border-lx-border pb-6 flex items-center justify-between">
        <div>
          <h1 className="font-oxanium text-[28px] font-extrabold text-lx-white tracking-tight leading-none mb-2">
            System Settings
          </h1>
          <p className="font-oxanium text-[13px] font-light text-lx-muted">
            Manage system parameters, reporting standards, and corporate profiles.
          </p>
        </div>

        {/* Development Purge database */}
        {user?.role === 'FOUNDER' && (
          <button
            onClick={handleReset}
            className="font-oxanium text-[11px] font-medium text-red-400 border border-red-900/40 rounded-[4px] px-3.5 py-1.5 hover:bg-red-950/40 hover:border-red-700 transition-all active:scale-[0.98]"
          >
            Reset Environment
          </button>
        )}
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Profile Card */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 space-y-6">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light block">
            {formatRole(user?.role)} Profile
          </span>

          <div className="flex items-center gap-4">
            <div className="w-[48px] h-[48px] rounded-full bg-lx-green flex items-center justify-center text-lx-white font-oxanium text-base font-bold tracking-wider select-none">
              {initials}
            </div>
            <div>
              <h3 className="font-oxanium text-base font-semibold text-lx-white leading-none">
                {user?.name || 'Aakesh Agnihotri'}
              </h3>
              <p className="font-oxanium text-[11px] text-lx-muted mt-1 leading-none">
                {user?.email || 'founder@luminexis.com'} &middot; Corporate Access Account
              </p>
            </div>
          </div>
        </div>

        {/* Team Invitation System (Founder/Admin only) */}
        {(user?.role === 'FOUNDER' || user?.role === 'ADMIN') && (
          <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 space-y-6">
            <div>
              <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light block mb-1">
                Team Workspace & Co-founders
              </span>
              <h3 className="font-oxanium text-sm font-semibold text-lx-white">
                Notion-style Invitations
              </h3>
              <p className="font-oxanium text-[11px] text-lx-muted mt-0.5">
                Send invitation tokens to register co-founders or team administrators.
              </p>
            </div>

            {/* Error / Success */}
            {error && <div className="text-red-400 text-[11px] font-oxanium">{error}</div>}
            {success && <div className="text-lx-green-glow text-[11px] font-oxanium">{success}</div>}

            {/* Invite Form */}
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-lx-muted" />
                <input
                  type="email"
                  required
                  disabled={isLoading}
                  placeholder="co-founder@luminexis.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] pl-10 pr-3.5 py-3 text-[13px] text-lx-white font-oxanium outline-none transition-colors w-full disabled:opacity-50"
                />
              </div>

              <select
                value={inviteRole}
                disabled={isLoading}
                onChange={(e) => setInviteRole(e.target.value)}
                className="bg-lx-surface-2 border border-lx-border focus:border-lx-green rounded-[4px] px-3.5 py-3 text-[12px] text-lx-white font-oxanium outline-none cursor-pointer disabled:opacity-50"
              >
                <option value="CO_FOUNDER">Co-founder</option>
                <option value="ADMIN">Administrator</option>
              </select>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-lx-green hover:bg-lx-green-mid text-white rounded-[4px] px-4 py-3 text-[12px] font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </form>

            {/* Pending Invites List */}
            {invitations.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-lx-border/50">
                <span className="text-[10px] text-lx-muted uppercase tracking-wider block font-semibold">
                  Pending Invitations ({invitations.length})
                </span>

                <div className="space-y-2">
                  {invitations.map((invite) => (
                    <div 
                      key={invite.id} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-lx-surface-2 rounded-[4px] border border-lx-border gap-3"
                    >
                      <div className="flex flex-col">
                        <span className="text-[12px] text-lx-white font-medium font-oxanium leading-tight">
                          {invite.email}
                        </span>
                        <span className="text-[9px] text-lx-muted uppercase tracking-wider mt-0.5 font-light">
                          Role: {formatRole(invite.role)} &middot; Expires {new Date(invite.expiresAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(invite)}
                          className="flex items-center gap-1.5 text-[11px] font-oxanium text-lx-green-glow hover:text-white px-2 py-1 bg-lx-green/10 border border-lx-green/30 rounded transition-colors"
                          title="Copy invitation Link"
                        >
                          {copiedId === invite.id ? <Check size={11} /> : <Copy size={11} />}
                          <span>{copiedId === invite.id ? 'Copied!' : 'Copy Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRevoke(invite.id)}
                          className="text-lx-muted hover:text-red-400 p-1.5 transition-colors"
                          title="Revoke Invitation"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Corporate Profile Card */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 space-y-6">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light block">
            Corporate Ledger Settings
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-lx-muted uppercase tracking-wider">Company Name</span>
              <span className="text-[13px] text-lx-white font-medium font-oxanium">Luminexis Technologies Private Limited</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-lx-muted uppercase tracking-wider">Corporate GSTIN</span>
              <span className="text-[13px] text-lx-white font-medium font-oxanium">07AAAAA1111A1Z1</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-lx-muted uppercase tracking-wider">Primary Currency</span>
              <span className="text-[13px] text-lx-white font-medium font-oxanium">INR (₹) &middot; Indian Rupee</span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-lx-muted uppercase tracking-wider">Accounting Standard</span>
              <span className="text-[13px] text-lx-white font-medium font-oxanium">Indian GAAP (IGAAP)</span>
            </div>
          </div>
        </div>

        {/* System parameters */}
        <div className="bg-lx-surface border border-lx-border rounded-[8px] p-6 space-y-6">
          <span className="editorial-label text-lx-green text-[10px] tracking-[0.2em] font-light block">
            System Preferences
          </span>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-lx-white font-medium">Automatic Ledger Postings</span>
              <span className="text-[10px] font-semibold text-lx-green-glow uppercase px-2.5 py-0.5 bg-lx-green-dark border border-lx-green/35 rounded-full">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-lx-white font-medium">Auto-Calc GST Rates (18% Default)</span>
              <span className="text-[10px] font-semibold text-lx-green-glow uppercase px-2.5 py-0.5 bg-lx-green-dark border border-lx-green/35 rounded-full">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Settings;

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserSidebar from '../components/userSidebar';
import api from '../api/axiosConfig';
import '../assets/dashboard.css';
import '../assets/profile.css';

export default function ProfilePage() {
  const { user, login } = useAuth();

  const [nameForm, setNameForm]   = useState({ name: user?.name || '' });
  const [pwForm, setPwForm]       = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [nameMsg, setNameMsg]     = useState('');
  const [pwMsg, setPwMsg]         = useState('');
  const [nameErr, setNameErr]     = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPw, setSavingPw]   = useState(false);

  const handleNameSave = async (e) => {
    e.preventDefault();
    setNameErr(''); setNameMsg('');
    if (!nameForm.name.trim()) { setNameErr('Name cannot be empty'); return; }
    setSavingName(true);
    try {
      const res = await api.put('/users/profile', { name: nameForm.name.trim() });
      // Update stored user
      login({ ...user, name: res.data.data.name });
      setNameMsg('Profile updated ✓');
      setTimeout(() => setNameMsg(''), 3000);
    } catch (e) {
      setNameErr(e.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingName(false);
    }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    setPwErr(''); setPwMsg('');
    if (pwForm.newPassword.length < 6) { setPwErr('New password must be at least 6 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirm) { setPwErr('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.put('/users/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwMsg('Password changed ✓');
      setTimeout(() => setPwMsg(''), 3000);
    } catch (e) {
      setPwErr(e.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="cx-shell">
      <UserSidebar />
      <div className="cx-main">
        <header className="cx-topbar">
          <div>
            <div className="cx-page-title">Profile</div>
            <div className="cx-page-sub">Manage your account settings</div>
          </div>
        </header>

        <div className="cx-content">
          <div className="pr-grid">
            {/* Account info */}
            <div className="pr-card">
              <div className="pr-card-head">Account Info</div>
              <div className="pr-avatar-row">
                <div className="pr-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                <div>
                  <div className="pr-user-name">{user?.name}</div>
                  <div className="pr-user-email">{user?.email}</div>
                  <span className="pr-role-badge">{user?.role}</span>
                </div>
              </div>

              <form onSubmit={handleNameSave} className="pr-form">
                <div className="pf-field">
                  <label>Display name</label>
                  <input
                    value={nameForm.name}
                    onChange={(e) => setNameForm({ name: e.target.value })}
                    placeholder="Your name"
                    maxLength={50}
                  />
                </div>
                {nameErr && <div className="pf-form-err">{nameErr}</div>}
                {nameMsg && <div className="pr-success">{nameMsg}</div>}
                <button type="submit" className="cx-refresh-btn" disabled={savingName}>
                  {savingName ? 'Saving…' : 'Save changes'}
                </button>
              </form>
            </div>

            {/* Change password */}
            <div className="pr-card">
              <div className="pr-card-head">Change Password</div>
              <form onSubmit={handlePwSave} className="pr-form">
                <div className="pf-field">
                  <label>Current password</label>
                  <input
                    type="password"
                    value={pwForm.currentPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </div>
                <div className="pf-field">
                  <label>New password</label>
                  <input
                    type="password"
                    value={pwForm.newPassword}
                    onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div className="pf-field">
                  <label>Confirm new password</label>
                  <input
                    type="password"
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
                {pwErr && <div className="pf-form-err">{pwErr}</div>}
                {pwMsg && <div className="pr-success">{pwMsg}</div>}
                <button type="submit" className="cx-refresh-btn" disabled={savingPw}>
                  {savingPw ? 'Saving…' : 'Change password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

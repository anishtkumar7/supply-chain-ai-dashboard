import { useState, useEffect } from 'react';
import { ROLE_CARDS } from '../config/roleNavConfig';

export function RoleLogin({ initialName, initialRoleId, onEnter }) {
  const [name, setName] = useState(() => (initialName || '').trim());
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId);

  useEffect(() => {
    setName((initialName || '').trim());
    setSelectedRoleId(initialRoleId);
  }, [initialName, initialRoleId]);

  const canEnter = Boolean(selectedRoleId);
  const handleEnter = () => {
    if (!canEnter) return;
    onEnter(name, selectedRoleId);
  };

  return (
    <form
      className="role-login"
      aria-label="Select role to continue"
      onSubmit={(e) => {
        e.preventDefault();
        handleEnter();
      }}
    >
      <div className="role-login__inner">
        <div className="role-login__brand">
          <span className="role-login__logo" aria-hidden />
          <span className="role-login__name">SC Control</span>
        </div>
        <p className="role-login__sub">Vectrum Manufacturing — North America Hub</p>

        <div className="role-login__field">
          <label className="role-login__label" htmlFor="role-login-name">Name</label>
          <input
            id="role-login-name"
            type="text"
            className="role-login__input"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={48}
            autoComplete="given-name"
          />
        </div>

        <h2 className="role-login__section-title">Select Your Role</h2>
        <div className="role-login__grid">
          {ROLE_CARDS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`role-card ${selectedRoleId === c.id ? 'role-card--selected' : ''}`}
              onClick={() => setSelectedRoleId(c.id)}
            >
              <span className="role-card__icon" aria-hidden>{c.icon}</span>
              <span className="role-card__title">{c.title}</span>
              <span className="role-card__desc">{c.description}</span>
            </button>
          ))}
        </div>

        <button
          type="submit"
          className="role-login__enter"
          disabled={!canEnter}
        >
          Enter Dashboard
        </button>
      </div>
    </form>
  );
}

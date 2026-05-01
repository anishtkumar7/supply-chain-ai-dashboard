import { useState, useEffect } from 'react';
import { ROLE_CARDS } from '../config/roleNavConfig';
import { RivitLogo } from './RivitLogo';

export function RoleLogin({ initialName, initialRoleId, onEnter }) {
  const [name, setName] = useState(() => (initialName || '').trim());
  const [selectedRoleId, setSelectedRoleId] = useState(initialRoleId);
  const roleCardsById = ROLE_CARDS.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {});
  const roleGridLayout = [
    'shop-supervisor',
    'material-coordinator',
    'buyer-planner',
    'mfg-engineer',
    'warehouse',
    'management',
    null,
    'admin',
    null,
  ];

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
      <div className="role-login__bg" aria-hidden />
      <div className="role-login__inner">
        <div className="role-login__brand role-login__brand--stack">
          <RivitLogo variant="login" />
        </div>
        <p className="role-login__tagline">Connect every role in your manufacturing operation.</p>
        <p className="role-login__sub">Powered by RIVIT — Vectrum Manufacturing · North America Hub</p>

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
          {roleGridLayout.map((roleId, idx) => {
            if (!roleId) {
              return <div key={`placeholder-${idx}`} className="role-card-placeholder" aria-hidden="true" />;
            }
            const c = roleCardsById[roleId];
            if (!c) return null;
            return (
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
            );
          })}
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

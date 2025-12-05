import React, { useState } from 'react';
import { Contact, Channel } from '../types';

interface ContactsPanelProps {
  contacts: Contact[];
  onChange: (updated: Contact[]) => void;
  onClose: () => void;
  onSimulateMessage?: (contact: Contact) => void;
}

const CHANNEL_OPTIONS: Channel[] = ['email', 'whatsapp', 'phone', 'teams', 'slack'];

export const ContactsPanel: React.FC<ContactsPanelProps> = ({
  contacts,
  onChange,
  onClose,
  onSimulateMessage,
}) => {
  const [localContacts, setLocalContacts] = useState<Contact[]>(contacts);
  const [filter, setFilter] = useState<string>('');

  const handleFieldChange = <K extends keyof Contact>(
    id: string,
    field: K,
    value: Contact[K]
  ) => {
    setLocalContacts(prev =>
      prev.map(c => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleAddContact = () => {
    const newContact: Contact = {
      id: crypto.randomUUID(),
      name: '',
      primaryChannel: 'email',
    };
    setLocalContacts(prev => [newContact, ...prev]);
  };

  const handleDeleteContact = (id: string) => {
    if (window.confirm('Delete this contact?')) {
      setLocalContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSave = () => {
    onChange(localContacts);
    onClose();
  };

  const filteredContacts = localContacts.filter(contact =>
    contact.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-800 overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-white">Contacts</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50">
          <div className="mb-4 flex gap-2">
            <input 
              className="flex-1 px-4 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Search contacts..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <button onClick={handleAddContact} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500">
              Add Contact
            </button>
          </div>

          <div className="space-y-3">
            {filteredContacts.length === 0 && (
              <div className="text-center text-slate-500 text-sm py-8">No contacts found.</div>
            )}
            {filteredContacts.map(contact => (
              <div key={contact.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col gap-3">
                <div className="flex gap-3">
                  <input
                    className="flex-1 font-medium text-white bg-transparent border-b border-transparent focus:border-slate-600 outline-none"
                    value={contact.name}
                    onChange={e => handleFieldChange(contact.id, 'name', e.target.value)}
                    placeholder="Name"
                  />
                  <select
                    className="text-xs bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-300"
                    value={contact.primaryChannel}
                    onChange={e => handleFieldChange(contact.id, 'primaryChannel', e.target.value as Channel)}
                  >
                    {CHANNEL_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button onClick={() => handleDeleteContact(contact.id)} className="text-slate-500 hover:text-red-400">
                    ✕
                  </button>
                </div>
                <div className="flex gap-3 text-sm">
                  <input
                    className="flex-1 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-slate-300 placeholder-slate-600"
                    value={contact.email || ''}
                    onChange={e => handleFieldChange(contact.id, 'email', e.target.value)}
                    placeholder="Email"
                  />
                  <input
                    className="flex-1 bg-slate-950 px-3 py-1.5 rounded border border-slate-800 text-slate-300 placeholder-slate-600"
                    value={contact.phone || ''}
                    onChange={e => handleFieldChange(contact.id, 'phone', e.target.value)}
                    placeholder="Phone"
                  />
                </div>
                {onSimulateMessage && (
                  <div className="flex justify-end">
                    <button 
                      onClick={() => onSimulateMessage(contact)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Simulate Message
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">Save Changes</button>
        </div>
      </div>
    </div>
  );
};
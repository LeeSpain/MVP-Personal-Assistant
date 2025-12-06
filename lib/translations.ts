export type Language = 'en' | 'nl';

export const translations = {
    en: {
        common: {
            loading: 'Loading...',
            processing: 'Processing...',
            save: 'Save',
            cancel: 'Cancel',
            delete: 'Delete',
            edit: 'Edit',
            undo: 'Undo',
            confirm: 'Confirm',
            today: 'Today',
            back: 'Back',
            close: 'Close',
        },
        nav: {
            diary: 'Diary',
            chat: 'Chat',
            today: 'Today',
            calendar: 'Calendar',
            settings: 'Settings',
            insights: 'Insights',
            contacts: 'Contacts',
            command: 'Command',
        },
        modes: {
            execution: 'Execution',
            deepWork: 'Deep Work',
            relationship: 'Relationship',
            recovery: 'Recovery',
        },
        chat: {
            placeholder: 'Type a message...',
            listening: 'Listening...',
            thinking: 'Thinking...',
            history: 'History',
            voiceMode: 'Voice Mode',
            hints: [
                'Create a deep work block tomorrow',
                'Switch me to Recovery mode',
                'Plan my week based on my goals',
                'Add a focus item to call John'
            ],
            noHistory: 'No history yet.',
            sessionFrom: 'Session from',
            messages: 'messages',
            selectSession: 'Select a session to view transcript',
            deleteSession: 'Delete this session?'
        },
        diary: {
            title: 'Diary',
            newEntry: 'New Entry',
            empty: 'No entries yet.',
            types: {
                reflection: 'Reflection',
                decision: 'Decision',
                idea: 'Idea',
                journal: 'Journal'
            }
        },
        calendar: {
            title: 'Calendar',
            month: 'Month',
            week: 'Week',
            list: 'List',
            noEvents: 'No events',
            noMeetings: 'No meetings scheduled for this day.',
            join: 'Join'
        },
        today: {
            title: 'Today',
            focus: 'Focus',
            schedule: 'Schedule',
            notifications: 'Notifications',
            addFocus: 'Add focus item...',
            emptyFocus: 'No focus items set.',
            emptySchedule: 'No meetings today.',
            emptyNotifications: 'No new notifications.'
        },
        settings: {
            title: 'Settings',
            language: 'Language',
            profile: 'Profile',
            integrations: 'Integrations',
            voice: 'Voice',
            automation: 'Automation',
            context: 'Context',
            reset: 'Reset Data',
            connect: 'Connect',
            disconnect: 'Disconnect',
            connected: 'Connected',
        },
        insights: {
            title: 'Executive Dashboard & Insights',
            metrics: {
                activity: 'Weekly Activity',
                loops: 'Open Loops',
                focus: 'Focus Ratio',
                network: 'Network Reach'
            },
            analysis: 'AI Strategic Analysis',
            breakdown: 'Work Distribution',
            status: 'System Status',
            close: 'Close Dashboard'
        },
        contacts: {
            title: 'Contacts',
            search: 'Search contacts...',
            add: 'Add Contact',
            empty: 'No contacts found.',
            simulate: 'Simulate Message',
            save: 'Save Changes'
        },
        command: {
            title: 'Command Palette',
            placeholder: 'e.g. Schedule a meeting with Lee next Tuesday...',
            plan: 'Plan Actions',
            planning: 'Planning...',
            actions: 'Planned Actions',
            execute: 'Execute Plan'
        },
        summary: {
            empty: 'No summary available.',
            footer: 'AI-generated summary based on your recent activity.',
            regenerate: 'Regenerate',
            regenerating: 'Regenerating...'
        },
        voice: {
            idle: 'Idle',
            listening: 'Listening...',
            thinking: 'Thinking',
            speaking: 'Speaking'
        },
        confirmations: {
            deleteDiary: 'Delete this diary entry?',
            deleteMeeting: 'Remove this meeting?',
            resetData: 'Are you sure you want to reset all data? This cannot be undone.'
        },
        notifications: {
            invalidAction: '⚠️ AI proposed invalid action ({type}). Ignored.',
            emailPlanned: '📧 Email planned to {name} via {channel}. Subject: "{subject}".',
            emailDraft: '⚠️ Draft Email created for {name} ({channel}). Review required.',
            videoLink: '🎥 Video link generated for "{title}"',
            memorized: '🧠 Memorized: "{content}..."',
            profileUpdated: '👤 Profile Updated',
            modeSwitched: '🔄 Mode switched to {mode}',
            undid: '↩️ Undid: {description}',
            commandExecuted: 'Executed command: {command} ({count} action(s))',
            simulatedMessage: 'Simulated message to {name} via {channel}.'
        }
    },
    nl: {
        common: {
            loading: 'Laden...',
            processing: 'Verwerken...',
            save: 'Opslaan',
            cancel: 'Annuleren',
            delete: 'Verwijderen',
            edit: 'Bewerken',
            undo: 'Ongedaan maken',
            confirm: 'Bevestigen',
            today: 'Vandaag',
            back: 'Terug',
            close: 'Sluiten',
        },
        nav: {
            diary: 'Dagboek',
            chat: 'Chat',
            today: 'Vandaag',
            calendar: 'Kalender',
            settings: 'Instellingen',
            insights: 'Inzichten',
            contacts: 'Contacten',
            command: 'Opdracht',
        },
        modes: {
            execution: 'Uitvoering',
            deepWork: 'Diep Werk',
            relationship: 'Relatie',
            recovery: 'Herstel',
        },
        chat: {
            placeholder: 'Typ een bericht...',
            listening: 'Luisteren...',
            thinking: 'Denken...',
            history: 'Geschiedenis',
            voiceMode: 'Spraakmodus',
            hints: [
                'Maak morgen een blok voor diep werk',
                'Zet me in Herstelmodus',
                'Plan mijn week op basis van mijn doelen',
                'Voeg een focuspunt toe om John te bellen'
            ],
            noHistory: 'Nog geen geschiedenis.',
            sessionFrom: 'Sessie van',
            messages: 'berichten',
            selectSession: 'Selecteer een sessie om het transcript te bekijken',
            deleteSession: 'Deze sessie verwijderen?'
        },
        diary: {
            title: 'Dagboek',
            newEntry: 'Nieuwe invoer',
            empty: 'Nog geen invoer.',
            types: {
                reflection: 'Reflectie',
                decision: 'Beslissing',
                idea: 'Idee',
                journal: 'Logboek'
            }
        },
        calendar: {
            title: 'Kalender',
            month: 'Maand',
            week: 'Week',
            list: 'Lijst',
            noEvents: 'Geen evenementen',
            noMeetings: 'Geen afspraken gepland voor deze dag.',
            join: 'Deelnemen'
        },
        today: {
            title: 'Vandaag',
            focus: 'Focus',
            schedule: 'Agenda',
            notifications: 'Meldingen',
            addFocus: 'Focuspunt toevoegen...',
            emptyFocus: 'Geen focuspunten ingesteld.',
            emptySchedule: 'Geen afspraken vandaag.',
            emptyNotifications: 'Geen nieuwe meldingen.'
        },
        settings: {
            title: 'Instellingen',
            language: 'Taal',
            profile: 'Profiel',
            integrations: 'Integraties',
            voice: 'Spraak',
            automation: 'Automatisering',
            context: 'Context',
            reset: 'Gegevens resetten',
            connect: 'Verbinden',
            disconnect: 'Verbreken',
            connected: 'Verbonden',
        },
        insights: {
            title: 'Dashboard & Inzichten',
            metrics: {
                activity: 'Wekelijkse Activiteit',
                loops: 'Open Lussen',
                focus: 'Focus Ratio',
                network: 'Netwerk Bereik'
            },
            analysis: 'AI Strategische Analyse',
            breakdown: 'Werkverdeling',
            status: 'Systeemstatus',
            close: 'Dashboard Sluiten'
        },
        contacts: {
            title: 'Contacten',
            search: 'Zoek contacten...',
            add: 'Contact Toevoegen',
            empty: 'Geen contacten gevonden.',
            simulate: 'Bericht Simuleren',
            save: 'Wijzigingen Opslaan'
        },
        command: {
            title: 'Opdracht Palet',
            placeholder: 'bijv. Plan een vergadering met Lee volgende dinsdag...',
            plan: 'Acties Plannen',
            planning: 'Plannen...',
            actions: 'Geplande Acties',
            execute: 'Plan Uitvoeren'
        },
        summary: {
            empty: 'Geen samenvatting beschikbaar.',
            footer: 'AI-gegenereerde samenvatting op basis van uw recente activiteit.',
            regenerate: 'Opnieuw genereren',
            regenerating: 'Opnieuw genereren...'
        },
        voice: {
            idle: 'Inactief',
            listening: 'Luisteren...',
            thinking: 'Denken',
            speaking: 'Spreken'
        },
        confirmations: {
            deleteDiary: 'Dit dagboekitem verwijderen?',
            deleteMeeting: 'Deze afspraak verwijderen?',
            resetData: 'Weet u zeker dat u alle gegevens wilt resetten? Dit kan niet ongedaan worden gemaakt.'
        },
        notifications: {
            invalidAction: '⚠️ AI stelde ongeldige actie voor ({type}). Genegeerd.',
            emailPlanned: '📧 E-mail gepland naar {name} via {channel}. Onderwerp: "{subject}".',
            emailDraft: '⚠️ Concept e-mail gemaakt voor {name} ({channel}). Beoordeling vereist.',
            videoLink: '🎥 Videolink gegenereerd voor "{title}"',
            memorized: '🧠 Gememoriseerd: "{content}..."',
            profileUpdated: '👤 Profiel bijgewerkt',
            modeSwitched: '🔄 Modus gewijzigd naar {mode}',
            undid: '↩️ Ongedaan gemaakt: {description}',
            commandExecuted: 'Opdracht uitgevoerd: {command} ({count} actie(s))',
            simulatedMessage: 'Gesimuleerd bericht naar {name} via {channel}.'
        }
    }
};

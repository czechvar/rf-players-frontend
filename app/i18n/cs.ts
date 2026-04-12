/**
 * Czech (cs) translation strings for RF Players app.
 *
 * Convention:
 *   - Keys are grouped by feature / page.
 *   - Flat keys use dot-separated namespaces (e.g. `auth.login`).
 *   - Interpolation uses {placeholder} syntax.
 */

const cs = {
  // ── Common / shared ──────────────────────────────────
  common: {
    appName: 'RF Players',
    save: 'Uložit',
    cancel: 'Zrušit',
    delete: 'Smazat',
    edit: 'Upravit',
    back: 'Zpět',
    loading: 'Načítání…',
    error: 'Chyba',
    success: 'Úspěch',
    confirm: 'Potvrdit',
    close: 'Zavřít',
    yes: 'Ano',
    no: 'Ne',
    optional: 'Nepovinné',
    required: 'Povinné',
    search: 'Hledat',
    filter: 'Filtrovat',
    noResults: 'Žádné výsledky',
    version: 'v1.0.0',
    footer: '© {year} RF Players – Správa fotbalového týmu',
  },

  // ── Roles ────────────────────────────────────────────
  roles: {
    admin: 'Administrátor',
    trainer: 'Trenér',
    player: 'Hráč',
    parent: 'Rodič',
  },

  // ── Navigation / Layout ──────────────────────────────
  nav: {
    events: 'Akce',
    players: 'Hráči',
    approvals: 'Schválení',
    myChildren: 'Moje děti',
    myProfile: 'Můj profil',
    login: 'Přihlásit se',
    register: 'Registrace',
    logout: 'Odhlásit se',
  },

  // ── Auth ─────────────────────────────────────────────
  auth: {
    loginTitle: 'Přihlášení',
    loginSubtitle: 'Přihlaste se pro přístup ke svému účtu',
    loginButton: 'Přihlásit se',
    loginFailed: 'Přihlášení se nezdařilo',
    email: 'E-mail',
    emailPlaceholder: 'Zadejte svůj e-mail',
    password: 'Heslo',
    passwordPlaceholder: 'Zadejte heslo',
    needAccount: 'Nemáte účet?',
    contactAdmin: 'Kontaktujte administrátora',
    sessionExpired: 'Relace vypršela. Přihlaste se znovu.',

    registerTitle: 'Vytvořit účet',
    registerSubtitle: 'Registrace hráče nebo rodiče',
    registerButton: 'Registrovat',
    registerFailed: 'Registrace se nezdařila',
    registerSuccess: 'Účet vytvořen! Přesměrování…',
    firstName: 'Jméno',
    lastName: 'Příjmení',
    role: 'Role',
    selectRole: 'Vyberte roli',
    playerRole: 'Hráč',
    parentRole: 'Rodič',
    dateOfBirth: 'Datum narození',
    backToLogin: 'Zpět na přihlášení',
    createAccount: 'Vytvořit účet',
    alreadyHaveAccount: 'Již máte účet?',

    // Verification & approval
    verifyTitle: 'Ověření e-mailu',
    verifySubtitle: 'Ověřujeme vaši e-mailovou adresu…',
    verifySuccess: 'E-mail úspěšně ověřen!',
    verifyFailed: 'Ověření e-mailu se nezdařilo. Odkaz může být neplatný nebo expirovaný.',
    verifyRedirectApproved: 'Váš účet je schválen. Přesměrování na přihlášení…',
    verifyRedirectPending: 'Váš účet čeká na schválení trenérem.',

    pendingApprovalTitle: 'Čeká na schválení',
    pendingApprovalMessage: 'Váš účet byl vytvořen a e-mail ověřen. Nyní čeká na schválení trenérem nebo administrátorem.',
    pendingApprovalHint: 'Budete informováni, jakmile bude váš účet schválen.',
    goToLogin: 'Přejít na přihlášení',

    registrationCompleteTitle: 'Registrace dokončena!',
    registrationCompleteMessage: 'Na vaši e-mailovou adresu jsme odeslali ověřovací odkaz. Klikněte na něj pro ověření vašeho účtu.',
    registrationCompleteHint: 'Prozatím klikněte na tlačítko níže pro ověření (e-mailové odesílání bude přidáno v budoucnu).',
    verifyNow: 'Ověřit e-mail nyní',

    // Login guards
    emailNotVerified: 'Váš e-mail ještě nebyl ověřen. Zkontrolujte svou schránku.',
    accountNotApproved: 'Váš účet čeká na schválení trenérem.',

    // Admin approval page
    approvalsTitle: 'Schválení uživatelů',
    approvalsSubtitle: 'Uživatelé čekající na schválení registrace',
    noApprovals: 'Žádní uživatelé nečekají na schválení',
    noApprovalsDesc: 'Všechny registrace byly zpracovány.',
    approveUser: 'Schválit',
    rejectUser: 'Zamítnout',
    userApproved: 'Uživatel byl schválen',
    userRejected: 'Uživatel byl zamítnut',
    approvalFailed: 'Schválení se nezdařilo',
    registeredAt: 'Registrován: {date}',
  },

  // ── Dashboard ────────────────────────────────────────
  dashboard: {
    welcomeBack: 'Vítejte zpět, {name}!',
    subtitle: 'Spravujte aktivity svého fotbalového týmu',
    quickOverview: 'Rychlý přehled',
    upcomingEvents: 'Nadcházející akce',
    pastEvents: 'Minulé akce',
    activePlayers: 'Aktivní hráči',
    activeTrainers: 'Aktivní trenéři',

    // Cards
    eventsCardTitle: 'Akce',
    eventsCardDesc: 'Zobrazit nadcházející tréninky, zápasy a turnaje',
    viewAllEvents: 'Zobrazit všechny akce',
    playersCardTitle: 'Hráči',
    playersCardDesc: 'Spravovat profily hráčů a registrace',
    viewAllPlayers: 'Zobrazit všechny hráče',
    createEventCardTitle: 'Vytvořit akci',
    createEventCardDesc: 'Naplánovat nový trénink nebo zápas',
    createNewEvent: 'Vytvořit novou akci',
    createPlayerCardTitle: 'Přidat hráče',
    createPlayerCardDesc: 'Zaregistrovat nového hráče do týmu',
    registerPlayer: 'Zaregistrovat hráče',
    myAttendanceTitle: 'Moje docházka',
    myAttendanceDesc: 'Sledovat historii a statistiky docházky',
    viewAttendance: 'Zobrazit docházku',

    // Login form (on index page)
    signIn: 'Přihlásit se',
    signInSubtitle: 'Přihlaste se pro přístup ke svému účtu',
  },

  // ── Events ───────────────────────────────────────────
  events: {
    title: 'Akce',
    createEvent: 'Vytvořit akci',
    viewPlayers: 'Zobrazit hráče',
    registerPlayer: 'Zaregistrovat hráče',
    noEvents: 'Žádné akce',
    noEventsDesc: 'Akce se zde zobrazí po vytvoření.',
    upcoming: 'Nadcházející akce',
    past: 'Minulé akce',
    noUpcoming: 'Žádné nadcházející akce',
    viewDetails: 'Zobrazit detail',
    locked: 'Uzamčeno',

    // Event types
    practice: 'Trénink',
    game: 'Zápas',
    tournament: 'Turnaj',
    meeting: 'Schůze',

    // Create event form
    createTitle: 'Vytvořit novou akci',
    createSubtitle: 'Vytvořte nový trénink, zápas nebo jinou akci pro tým.',
    eventName: 'Název akce',
    eventNamePlaceholder: 'např. Pravidelný trénink',
    dateTime: 'Datum a čas',
    location: 'Místo',
    locationPlaceholder: 'např. Hlavní fotbalové hřiště',
    eventType: 'Typ akce',
    description: 'Popis',
    descriptionHint: 'Volitelné podrobnosti k akci',
    descriptionPlaceholder: 'Další informace o akci…',
    eventCreated: 'Akce byla úspěšně vytvořena!',
    eventCreatedRedirect: 'Přesměrování na seznam akcí…',

    // Event detail
    dateTimeLabel: 'Datum a čas',
    locationLabel: 'Místo',
    eventTypeLabel: 'Typ akce',

    // Event management
    eventManagement: 'Správa akce',
    lockEvent: 'Uzamknout akci',
    unlockEvent: 'Odemknout akci',
    eventLocked: 'Akce uzamčena',
    lockInfo: 'Uzamčení akce zabrání dalším registracím a změnám docházky.',
    lockedInfo: 'Tato akce je uzamčena. Změny může provádět pouze administrátor.',
  },

  // ── Attendance ───────────────────────────────────────
  attendance: {
    title: 'Správa docházky',
    subtitle: 'Označte docházku hráčů na tuto akci',
    filterByName: 'Filtrovat podle jména hráče…',
    allStatuses: 'Všechny stavy',
    noRecords: 'Pro tuto akci nebyly nalezeny žádné záznamy o docházce.',
    noRecordsReasons: 'Možné důvody:',
    noPlayersYet: 'Zatím nebyli vytvořeni žádní hráči',
    eventBeforeSystem: 'Akce byla vytvořena před zavedením systému docházky',
    needGeneration: 'Záznamy docházky je třeba vygenerovat',
    noMatchFilter: 'Žádní hráči neodpovídají aktuálnímu filtru.',
    debugConnection: 'Testovat připojení',
    testBackend: 'Testovat backend',
    eventIsLocked: 'Akce je uzamčena',

    // Statuses
    pending: 'Čeká',
    attending: 'Zúčastní se',
    declined: 'Nezúčastní se',
    attended: 'Zúčastnil/a se',
    excused: 'Omluven/a',

    // Summary labels
    summaryAttended: 'Zúčastnili se',
    summaryDeclined: 'Nezúčastnili se',
    summaryExcused: 'Omluveni',
    summaryPending: 'Čeká',

    // Buttons
    ok: 'OK',
    no: 'NE',
    excusedButton: 'Omluven',

    // Excused modal
    markAsExcused: 'Označit jako omluveného',
    excusedReason: 'Důvod omluvené absence (povinné):',
    excusedPlaceholder: 'Zadejte důvod omluvené absence…',

    // Errors
    updateFailed: 'Nepodařilo se aktualizovat docházku',
  },

  // ── Players ──────────────────────────────────────────
  players: {
    title: 'Hráči týmu',
    subtitle: 'Správa zaregistrovaných hráčů',
    registerNew: 'Zaregistrovat nového hráče',
    noPlayers: 'Žádní zaregistrovaní hráči',
    noPlayersDesc: 'Začněte registrací prvního hráče.',
    registerFirst: 'Zaregistrovat prvního hráče',
    registeredPlayers: 'Zaregistrovaní hráči ({count})',
    inactive: 'Neaktivní',
    pendingApproval: 'Čeká na schválení',
    age: 'Věk',
    phone: 'Telefon',
    registered: 'Registrován',
    viewDetails: 'Zobrazit detail',
    editPlayer: 'Upravit hráče',
    deactivate: 'Deaktivovat',

    // Create player form
    createTitle: 'Zaregistrovat nového hráče',
    createSubtitle: 'Přidejte nového hráče do týmu. Přihlašovací údaje budou automaticky vygenerovány.',
    firstNamePlaceholder: 'Jméno',
    lastNamePlaceholder: 'Příjmení',
    emailHintCustom: 'Používá se vlastní e-mailová adresa',
    emailHintAuto: 'Ponechte prázdné pro automatické vygenerování z jména',
    emailPlaceholder: 'Zadejte e-mail nebo ponechte prázdné',
    finalEmail: 'Výsledný e-mail:',
    dateOfBirth: 'Datum narození',
    phoneNumber: 'Telefonní číslo',
    phoneNumberPlaceholder: '+420 123 456 789',

    // Auto setup info
    autoSetupTitle: 'Automatické nastavení',
    autoSetupEmail: 'Zadejte známý e-mail nebo ponechte prázdné pro automatické vygenerování',
    autoSetupPassword: 'Bezpečné heslo bude automaticky vygenerováno',
    autoSetupEvents: 'Hráč bude zaregistrován na všechny nadcházející akce se stavem „čeká"',
    autoSetupCredentials: 'Přihlašovací údaje budou zobrazeny po registraci',

    // Success
    playerCreated: 'Hráč byl úspěšně zaregistrován!',
    credentialsInfo: 'Nový hráčský účet byl vytvořen s následujícími přihlašovacími údaji:',
    emailLabel: 'E-mail:',
    passwordLabel: 'Heslo:',
    autoRegistered: 'Automaticky zaregistrován na nadcházející akce',
    autoRegisteredDesc: 'Hráč byl zaregistrován na {count} nadcházejících akcí se stavem „čeká".',
    shareCredentials: 'Sdílejte tyto přihlašovací údaje s hráčem nebo jeho rodiči.',

    // Player detail / edit
    playerProfile: 'Profil hráče',
    basicInfo: 'Základní informace',
    emailAddress: 'E-mailová adresa',
    adminOnlyEmail: 'Pouze administrátor může měnit e-mailové adresy',
    statusSettings: 'Stav a nastavení',
    accountStatus: 'Stav účtu',
    activePlayer: 'Aktivní hráč',
    activePlayerHint: 'Neaktivní hráči se nemohou účastnit akcí',
    approvalStatus: 'Stav schválení',
    approvedForParticipation: 'Schváleno k účasti',
    approvalHint: 'Neschválení hráči potřebují schválení trenéra/admina',
    saveChanges: 'Uložit změny',
    playerUpdated: 'Informace o hráči byly úspěšně aktualizovány',

    // Photo
    profilePhoto: 'Profilová fotka',
    changePhoto: 'Změnit fotku',
    uploadPhoto: 'Nahrát fotku',
    removePhoto: 'Odstranit fotku',
    photoFormats: 'Podporované formáty: JPEG, PNG, WebP',
    photoMaxSize: 'Maximální velikost: 2 MB',
    uploadingPhoto: 'Nahrávání fotky…',
    photoUpdated: 'Profilová fotka byla úspěšně aktualizována',
    photoRemoved: 'Profilová fotka byla úspěšně odstraněna',

    // Quick info sidebar
    quickInfo: 'Rychlé informace',
    ageLabel: 'Věk:',
    notSet: 'Nenastaveno',
    statusLabel: 'Stav:',
    active: 'Aktivní',
    inactiveStatus: 'Neaktivní',
    approvalLabel: 'Schválení:',
    approved: 'Schváleno',
    pending: 'Čeká',
    registeredLabel: 'Registrován:',
    lastUpdated: 'Poslední změna:',

    // Quick actions
    quickActions: 'Rychlé akce',
    viewEventHistory: 'Zobrazit historii akcí',
    attendanceReport: 'Výkaz docházky',
    sendMessage: 'Odeslat zprávu',
    futureFeatures: 'Tyto funkce budou dostupné v budoucích aktualizacích',

    // Errors
    notAPlayer: 'Tento uživatel není hráč',
    permissionDenied: 'Nemáte oprávnění upravovat tohoto hráče. Kontaktujte administrátora.',
    invalidData: 'Neplatná data. Zkontrolujte své vstupy.',
    emailConflict: 'E-mailová adresa je již používána jiným uživatelem.',
    updateFailed: 'Nepodařilo se aktualizovat hráče. Zkuste to znovu.',

    // Photo errors
    photoAccessDenied: 'Přístup odepřen. Možná nemáte oprávnění nahrávat fotky nebo vaše relace vypršela.',
    photoAuthExpired: 'Ověření vypršelo. Obnovte stránku a přihlaste se znovu.',
    photoTooLarge: 'Soubor je příliš velký. Vyberte menší obrázek (max 2 MB).',
    photoUnsupported: 'Nepodporovaný typ souboru. Nahrajte obrázek JPEG, PNG nebo WebP.',
    photoInvalid: 'Neplatný formát nebo poškozený soubor. Zkuste jiný obrázek.',
    photoNetworkError: 'Chyba sítě. Zkontrolujte připojení a zkuste to znovu.',
    photoUploadFailed: 'Nahrání se nezdařilo',
    photoRemoveFailed: 'Nepodařilo se odstranit fotku',
  },

  // ── Validation ───────────────────────────────────────
  validation: {
    firstNameRequired: 'Jméno je povinné',
    lastNameRequired: 'Příjmení je povinné',
    emailRequired: 'E-mail je povinný',
    emailInvalid: 'Zadejte platnou e-mailovou adresu',
    passwordRequired: 'Heslo je povinné',
    passwordMin: 'Heslo musí mít alespoň 6 znaků',
    roleRequired: 'Vyberte roli',
    dateOfBirthRequired: 'Datum narození je povinné pro hráče',
    eventNameRequired: 'Název akce je povinný',
    dateRequired: 'Datum a čas jsou povinné',
    locationRequired: 'Místo je povinné',
    loadFailed: 'Nepodařilo se načíst data',
  },

  // ── Errors ───────────────────────────────────────────
  errors: {
    accessDenied: 'Přístup odepřen. Vyžadována role administrátora nebo trenéra.',
    generic: 'Něco se pokazilo. Zkuste to znovu.',
    notFound: 'Stránka nebyla nalezena',
  },
} as const

export type TranslationKeys = typeof cs
export default cs

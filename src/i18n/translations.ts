/**
 * BUS-Tickets - Translations
 * Copyright (c) 2024-2026 IT Enterprise
 */

export type SupportedLanguage = 'cs' | 'en' | 'uk';

export interface Translations {
  // Common
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    confirm: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    done: string;
    search: string;
    retry: string;
    refresh: string;
    noResults: string;
    today: string;
    tomorrow: string;
    from: string;
    to: string;
    price: string;
    total: string;
    free: string;
  };

  // Navigation
  nav: {
    home: string;
    tickets: string;
    profile: string;
    settings: string;
  };

  // Search screen
  search: {
    title: string;
    subtitle: string;
    originPlaceholder: string;
    destinationPlaceholder: string;
    selectOriginFirst: string;
    selectDate: string;
    passengers: string;
    searchButton: string;
    popularRoutes: string;
    priceFrom: string;
    whereFrom: string;
    whereTo: string;
  };

  // Search results
  results: {
    title: string;
    noTrips: string;
    tryDifferentCriteria: string;
    departure: string;
    arrival: string;
    duration: string;
    seatsAvailable: string;
    soldOut: string;
    bookNow: string;
    filters: string;
    sortBy: string;
    cheapest: string;
    fastest: string;
    earliest: string;
    latest: string;
  };

  // Booking
  booking: {
    title: string;
    tripDetails: string;
    passengerDetails: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    selectSeat: string;
    selectedSeats: string;
    paymentMethod: string;
    termsAccept: string;
    termsLink: string;
    bookButton: string;
    processing: string;
    successTitle: string;
    successMessage: string;
    errorTitle: string;
    errorMessage: string;
    pricePerPerson: string;
    totalPrice: string;
  };

  // Payment
  payment: {
    title: string;
    selectMethod: string;
    card: string;
    cash: string;
    monobank: string;
    liqpay: string;
    applePay: string;
    googlePay: string;
    processing: string;
    success: string;
    failed: string;
    cancelled: string;
    payNow: string;
    payOnBoard: string;
    redirecting: string;
    confirmCash: string;
    cashNote: string;
  };

  // Tickets
  tickets: {
    title: string;
    active: string;
    past: string;
    noTickets: string;
    bookFirst: string;
    ticketNumber: string;
    passenger: string;
    seat: string;
    status: string;
    confirmed: string;
    pending: string;
    cancelled: string;
    used: string;
    downloadPdf: string;
    showQr: string;
    addToWallet: string;
  };

  // Profile
  profile: {
    title: string;
    guest: string;
    signIn: string;
    signOut: string;
    signOutConfirm: string;
    myTickets: string;
    myBookings: string;
    favorites: string;
    paymentHistory: string;
    personalInfo: string;
    editProfile: string;
    deleteAccount: string;
    deleteAccountConfirm: string;
  };

  // Auth
  auth: {
    signInTitle: string;
    signUpTitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    forgotPassword: string;
    signInButton: string;
    signUpButton: string;
    orContinueWith: string;
    google: string;
    facebook: string;
    apple: string;
    noAccount: string;
    hasAccount: string;
    magicLink: string;
    sendMagicLink: string;
    magicLinkSent: string;
    checkEmail: string;
    twoFactor: string;
    enterCode: string;
    resendCode: string;
    verifyButton: string;
    invalidCredentials: string;
    networkError: string;
  };

  // Settings
  settings: {
    title: string;
    appearance: string;
    darkMode: string;
    light: string;
    dark: string;
    system: string;
    language: string;
    notifications: string;
    notificationsDesc: string;
    syncStatus: string;
    offline: string;
    synced: string;
    pending: string;
    forceSync: string;
    backend: string;
    currentBackend: string;
    changeBackend: string;
    connect: string;
    connecting: string;
    legal: string;
    privacyPolicy: string;
    termsOfService: string;
    about: string;
    appName: string;
    version: string;
    developer: string;
    resetSettings: string;
    resetConfirm: string;
    reset: string;
  };

  // Notifications
  notifications: {
    title: string;
    pushEnabled: string;
    pushDisabled: string;
    enablePush: string;
    tripReminders: string;
    tripRemindersDesc: string;
    promoOffers: string;
    promoOffersDesc: string;
    priceAlerts: string;
    priceAlertsDesc: string;
    scheduleChanges: string;
    scheduleChangesDesc: string;
    soundEnabled: string;
    vibrationEnabled: string;
  };

  // Errors
  errors: {
    generic: string;
    network: string;
    serverError: string;
    notFound: string;
    unauthorized: string;
    sessionExpired: string;
    invalidInput: string;
    paymentFailed: string;
    bookingFailed: string;
    tryAgain: string;
  };

  // Date/Time
  datetime: {
    today: string;
    tomorrow: string;
    yesterday: string;
    minutes: string;
    hours: string;
    days: string;
    ago: string;
    in: string;
  };
}

export const translations: Record<SupportedLanguage, Translations> = {
  // Czech translations
  cs: {
    common: {
      loading: 'Načítání...',
      error: 'Chyba',
      success: 'Úspěch',
      cancel: 'Zrušit',
      confirm: 'Potvrdit',
      save: 'Uložit',
      delete: 'Smazat',
      edit: 'Upravit',
      close: 'Zavřít',
      back: 'Zpět',
      next: 'Další',
      done: 'Hotovo',
      search: 'Hledat',
      retry: 'Zkusit znovu',
      refresh: 'Obnovit',
      noResults: 'Žádné výsledky',
      today: 'Dnes',
      tomorrow: 'Zítra',
      from: 'Z',
      to: 'Do',
      price: 'Cena',
      total: 'Celkem',
      free: 'Zdarma',
    },
    nav: {
      home: 'Hledat',
      tickets: 'Jízdenky',
      profile: 'Profil',
      settings: 'Nastavení',
    },
    search: {
      title: 'Autobusové jízdenky',
      subtitle: 'Vyhledejte a rezervujte jízdenky',
      originPlaceholder: 'Odkud (vyberte zastávku)',
      destinationPlaceholder: 'Kam (vyberte cíl)',
      selectOriginFirst: 'Nejprve vyberte odkud',
      selectDate: 'Vyberte datum',
      passengers: 'Počet cestujících',
      searchButton: 'Hledat spoje',
      popularRoutes: 'Oblíbené trasy',
      priceFrom: 'od',
      whereFrom: 'Odkud jedete?',
      whereTo: 'Kam jedete?',
    },
    results: {
      title: 'Výsledky hledání',
      noTrips: 'Nebyly nalezeny žádné spoje',
      tryDifferentCriteria: 'Zkuste změnit kritéria vyhledávání',
      departure: 'Odjezd',
      arrival: 'Příjezd',
      duration: 'Doba jízdy',
      seatsAvailable: 'volných míst',
      soldOut: 'Vyprodáno',
      bookNow: 'Rezervovat',
      filters: 'Filtry',
      sortBy: 'Seřadit podle',
      cheapest: 'Nejlevnější',
      fastest: 'Nejrychlejší',
      earliest: 'Nejdříve',
      latest: 'Nejpozději',
    },
    booking: {
      title: 'Rezervace',
      tripDetails: 'Detaily cesty',
      passengerDetails: 'Údaje cestujícího',
      firstName: 'Jméno',
      lastName: 'Příjmení',
      email: 'E-mail',
      phone: 'Telefon',
      selectSeat: 'Vyberte místo',
      selectedSeats: 'Vybraná místa',
      paymentMethod: 'Způsob platby',
      termsAccept: 'Souhlasím s',
      termsLink: 'obchodními podmínkami',
      bookButton: 'Dokončit rezervaci',
      processing: 'Zpracování...',
      successTitle: 'Rezervace dokončena!',
      successMessage: 'Vaše jízdenky byly odeslány na váš e-mail.',
      errorTitle: 'Chyba rezervace',
      errorMessage: 'Při rezervaci došlo k chybě. Zkuste to prosím znovu.',
      pricePerPerson: 'Cena za osobu',
      totalPrice: 'Celková cena',
    },
    payment: {
      title: 'Platba',
      selectMethod: 'Vyberte způsob platby',
      card: 'Platební karta',
      cash: 'Hotově u řidiče',
      monobank: 'Monobank',
      liqpay: 'LiqPay',
      applePay: 'Apple Pay',
      googlePay: 'Google Pay',
      processing: 'Zpracování platby...',
      success: 'Platba byla úspěšná!',
      failed: 'Platba se nezdařila',
      cancelled: 'Platba byla zrušena',
      payNow: 'Zaplatit nyní',
      payOnBoard: 'Platba na místě',
      redirecting: 'Přesměrování na platební bránu...',
      confirmCash: 'Potvrdit platbu v hotovosti',
      cashNote: 'Zaplatíte přímo řidiči při nástupu do autobusu.',
    },
    tickets: {
      title: 'Moje jízdenky',
      active: 'Aktivní',
      past: 'Historie',
      noTickets: 'Žádné jízdenky',
      bookFirst: 'Zatím nemáte žádné jízdenky. Rezervujte si první cestu!',
      ticketNumber: 'Číslo jízdenky',
      passenger: 'Cestující',
      seat: 'Místo',
      status: 'Stav',
      confirmed: 'Potvrzeno',
      pending: 'Čeká na platbu',
      cancelled: 'Zrušeno',
      used: 'Použito',
      downloadPdf: 'Stáhnout PDF',
      showQr: 'Zobrazit QR kód',
      addToWallet: 'Přidat do Wallet',
    },
    profile: {
      title: 'Můj profil',
      guest: 'Host',
      signIn: 'Přihlásit se',
      signOut: 'Odhlásit se',
      signOutConfirm: 'Opravdu se chcete odhlásit?',
      myTickets: 'Moje jízdenky',
      myBookings: 'Moje rezervace',
      favorites: 'Oblíbené',
      paymentHistory: 'Historie plateb',
      personalInfo: 'Osobní údaje',
      editProfile: 'Upravit profil',
      deleteAccount: 'Smazat účet',
      deleteAccountConfirm: 'Opravdu chcete smazat svůj účet? Tato akce je nevratná.',
    },
    auth: {
      signInTitle: 'Přihlášení',
      signUpTitle: 'Registrace',
      email: 'E-mail',
      password: 'Heslo',
      confirmPassword: 'Potvrzení hesla',
      forgotPassword: 'Zapomenuté heslo?',
      signInButton: 'Přihlásit se',
      signUpButton: 'Zaregistrovat se',
      orContinueWith: 'nebo pokračujte přes',
      google: 'Google',
      facebook: 'Facebook',
      apple: 'Apple',
      noAccount: 'Nemáte účet?',
      hasAccount: 'Máte již účet?',
      magicLink: 'Přihlášení odkazem',
      sendMagicLink: 'Odeslat přihlašovací odkaz',
      magicLinkSent: 'Odkaz odeslán!',
      checkEmail: 'Zkontrolujte svůj e-mail a klikněte na přihlašovací odkaz.',
      twoFactor: 'Dvoufaktorové ověření',
      enterCode: 'Zadejte kód z aplikace',
      resendCode: 'Odeslat znovu',
      verifyButton: 'Ověřit',
      invalidCredentials: 'Neplatné přihlašovací údaje',
      networkError: 'Chyba sítě. Zkontrolujte připojení.',
    },
    settings: {
      title: 'Nastavení',
      appearance: 'Vzhled',
      darkMode: 'Tmavý režim',
      light: 'Světlý',
      dark: 'Tmavý',
      system: 'Systém',
      language: 'Jazyk',
      notifications: 'Oznámení',
      notificationsDesc: 'Spravovat nastavení oznámení',
      syncStatus: 'Stav synchronizace',
      offline: 'Offline - Změny budou synchronizovány po připojení',
      synced: 'Vše synchronizováno',
      pending: 'čekajících akcí',
      forceSync: 'Vynutit synchronizaci',
      backend: 'Konfigurace backendu',
      currentBackend: 'Aktuální backend',
      changeBackend: 'Změnit backend',
      connect: 'Připojit',
      connecting: 'Připojování...',
      legal: 'Právní',
      privacyPolicy: 'Zásady ochrany osobních údajů',
      termsOfService: 'Obchodní podmínky',
      about: 'O aplikaci',
      appName: 'Název aplikace',
      version: 'Verze',
      developer: 'Vývojář',
      resetSettings: 'Obnovit výchozí nastavení',
      resetConfirm: 'Tímto se všechna nastavení vrátí do výchozího stavu. Pokračovat?',
      reset: 'Obnovit',
    },
    notifications: {
      title: 'Oznámení',
      pushEnabled: 'Push oznámení jsou povolena',
      pushDisabled: 'Push oznámení jsou zakázána',
      enablePush: 'Povolit push oznámení',
      tripReminders: 'Připomenutí cesty',
      tripRemindersDesc: 'Připomenout cestu den předem a hodinu před odjezdem',
      promoOffers: 'Slevové nabídky',
      promoOffersDesc: 'Informovat o speciálních akcích a slevách',
      priceAlerts: 'Upozornění na ceny',
      priceAlertsDesc: 'Upozornit při změně ceny na oblíbených trasách',
      scheduleChanges: 'Změny jízdního řádu',
      scheduleChangesDesc: 'Upozornit na zpoždění nebo změny v jízdním řádu',
      soundEnabled: 'Zvuk',
      vibrationEnabled: 'Vibrace',
    },
    errors: {
      generic: 'Něco se pokazilo',
      network: 'Chyba sítě. Zkontrolujte připojení k internetu.',
      serverError: 'Chyba serveru. Zkuste to prosím později.',
      notFound: 'Požadovaná položka nebyla nalezena.',
      unauthorized: 'Nemáte oprávnění k této akci.',
      sessionExpired: 'Vaše relace vypršela. Přihlaste se znovu.',
      invalidInput: 'Neplatný vstup. Zkontrolujte zadaná data.',
      paymentFailed: 'Platba se nezdařila. Zkuste to prosím znovu.',
      bookingFailed: 'Rezervace se nezdařila. Zkuste to prosím znovu.',
      tryAgain: 'Zkusit znovu',
    },
    datetime: {
      today: 'Dnes',
      tomorrow: 'Zítra',
      yesterday: 'Včera',
      minutes: 'min',
      hours: 'hod',
      days: 'dní',
      ago: 'před',
      in: 'za',
    },
  },

  // English translations
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      search: 'Search',
      retry: 'Retry',
      refresh: 'Refresh',
      noResults: 'No results',
      today: 'Today',
      tomorrow: 'Tomorrow',
      from: 'From',
      to: 'To',
      price: 'Price',
      total: 'Total',
      free: 'Free',
    },
    nav: {
      home: 'Search',
      tickets: 'Tickets',
      profile: 'Profile',
      settings: 'Settings',
    },
    search: {
      title: 'Bus Tickets',
      subtitle: 'Search and book your tickets',
      originPlaceholder: 'From (select stop)',
      destinationPlaceholder: 'To (select destination)',
      selectOriginFirst: 'First select origin',
      selectDate: 'Select date',
      passengers: 'Passengers',
      searchButton: 'Search trips',
      popularRoutes: 'Popular routes',
      priceFrom: 'from',
      whereFrom: 'Where from?',
      whereTo: 'Where to?',
    },
    results: {
      title: 'Search Results',
      noTrips: 'No trips found',
      tryDifferentCriteria: 'Try changing your search criteria',
      departure: 'Departure',
      arrival: 'Arrival',
      duration: 'Duration',
      seatsAvailable: 'seats available',
      soldOut: 'Sold out',
      bookNow: 'Book now',
      filters: 'Filters',
      sortBy: 'Sort by',
      cheapest: 'Cheapest',
      fastest: 'Fastest',
      earliest: 'Earliest',
      latest: 'Latest',
    },
    booking: {
      title: 'Booking',
      tripDetails: 'Trip details',
      passengerDetails: 'Passenger details',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      selectSeat: 'Select seat',
      selectedSeats: 'Selected seats',
      paymentMethod: 'Payment method',
      termsAccept: 'I agree to the',
      termsLink: 'terms and conditions',
      bookButton: 'Complete booking',
      processing: 'Processing...',
      successTitle: 'Booking complete!',
      successMessage: 'Your tickets have been sent to your email.',
      errorTitle: 'Booking error',
      errorMessage: 'An error occurred during booking. Please try again.',
      pricePerPerson: 'Price per person',
      totalPrice: 'Total price',
    },
    payment: {
      title: 'Payment',
      selectMethod: 'Select payment method',
      card: 'Credit card',
      cash: 'Cash to driver',
      monobank: 'Monobank',
      liqpay: 'LiqPay',
      applePay: 'Apple Pay',
      googlePay: 'Google Pay',
      processing: 'Processing payment...',
      success: 'Payment successful!',
      failed: 'Payment failed',
      cancelled: 'Payment cancelled',
      payNow: 'Pay now',
      payOnBoard: 'Pay on board',
      redirecting: 'Redirecting to payment gateway...',
      confirmCash: 'Confirm cash payment',
      cashNote: 'You will pay directly to the driver when boarding the bus.',
    },
    tickets: {
      title: 'My Tickets',
      active: 'Active',
      past: 'Past',
      noTickets: 'No tickets',
      bookFirst: 'You have no tickets yet. Book your first trip!',
      ticketNumber: 'Ticket number',
      passenger: 'Passenger',
      seat: 'Seat',
      status: 'Status',
      confirmed: 'Confirmed',
      pending: 'Pending payment',
      cancelled: 'Cancelled',
      used: 'Used',
      downloadPdf: 'Download PDF',
      showQr: 'Show QR code',
      addToWallet: 'Add to Wallet',
    },
    profile: {
      title: 'My Profile',
      guest: 'Guest',
      signIn: 'Sign in',
      signOut: 'Sign out',
      signOutConfirm: 'Are you sure you want to sign out?',
      myTickets: 'My tickets',
      myBookings: 'My bookings',
      favorites: 'Favorites',
      paymentHistory: 'Payment history',
      personalInfo: 'Personal info',
      editProfile: 'Edit profile',
      deleteAccount: 'Delete account',
      deleteAccountConfirm: 'Are you sure you want to delete your account? This action cannot be undone.',
    },
    auth: {
      signInTitle: 'Sign In',
      signUpTitle: 'Sign Up',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      forgotPassword: 'Forgot password?',
      signInButton: 'Sign in',
      signUpButton: 'Sign up',
      orContinueWith: 'or continue with',
      google: 'Google',
      facebook: 'Facebook',
      apple: 'Apple',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      magicLink: 'Sign in with link',
      sendMagicLink: 'Send login link',
      magicLinkSent: 'Link sent!',
      checkEmail: 'Check your email and click the login link.',
      twoFactor: 'Two-factor authentication',
      enterCode: 'Enter the code from your app',
      resendCode: 'Resend code',
      verifyButton: 'Verify',
      invalidCredentials: 'Invalid credentials',
      networkError: 'Network error. Check your connection.',
    },
    settings: {
      title: 'Settings',
      appearance: 'Appearance',
      darkMode: 'Dark mode',
      light: 'Light',
      dark: 'Dark',
      system: 'System',
      language: 'Language',
      notifications: 'Notifications',
      notificationsDesc: 'Manage notification settings',
      syncStatus: 'Sync status',
      offline: 'Offline - Changes will sync when connected',
      synced: 'All synced',
      pending: 'pending actions',
      forceSync: 'Force sync',
      backend: 'Backend configuration',
      currentBackend: 'Current backend',
      changeBackend: 'Change backend',
      connect: 'Connect',
      connecting: 'Connecting...',
      legal: 'Legal',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      about: 'About',
      appName: 'App name',
      version: 'Version',
      developer: 'Developer',
      resetSettings: 'Reset to default',
      resetConfirm: 'This will reset all settings to default. Continue?',
      reset: 'Reset',
    },
    notifications: {
      title: 'Notifications',
      pushEnabled: 'Push notifications are enabled',
      pushDisabled: 'Push notifications are disabled',
      enablePush: 'Enable push notifications',
      tripReminders: 'Trip reminders',
      tripRemindersDesc: 'Remind about trip a day before and an hour before departure',
      promoOffers: 'Promotional offers',
      promoOffersDesc: 'Receive special offers and discounts',
      priceAlerts: 'Price alerts',
      priceAlertsDesc: 'Alert when price changes on favorite routes',
      scheduleChanges: 'Schedule changes',
      scheduleChangesDesc: 'Alert about delays or schedule changes',
      soundEnabled: 'Sound',
      vibrationEnabled: 'Vibration',
    },
    errors: {
      generic: 'Something went wrong',
      network: 'Network error. Check your internet connection.',
      serverError: 'Server error. Please try again later.',
      notFound: 'The requested item was not found.',
      unauthorized: 'You are not authorized to perform this action.',
      sessionExpired: 'Your session has expired. Please sign in again.',
      invalidInput: 'Invalid input. Please check your data.',
      paymentFailed: 'Payment failed. Please try again.',
      bookingFailed: 'Booking failed. Please try again.',
      tryAgain: 'Try again',
    },
    datetime: {
      today: 'Today',
      tomorrow: 'Tomorrow',
      yesterday: 'Yesterday',
      minutes: 'min',
      hours: 'h',
      days: 'days',
      ago: 'ago',
      in: 'in',
    },
  },

  // Ukrainian translations
  uk: {
    common: {
      loading: 'Завантаження...',
      error: 'Помилка',
      success: 'Успішно',
      cancel: 'Скасувати',
      confirm: 'Підтвердити',
      save: 'Зберегти',
      delete: 'Видалити',
      edit: 'Редагувати',
      close: 'Закрити',
      back: 'Назад',
      next: 'Далі',
      done: 'Готово',
      search: 'Пошук',
      retry: 'Повторити',
      refresh: 'Оновити',
      noResults: 'Нічого не знайдено',
      today: 'Сьогодні',
      tomorrow: 'Завтра',
      from: 'Звідки',
      to: 'Куди',
      price: 'Ціна',
      total: 'Всього',
      free: 'Безкоштовно',
    },
    nav: {
      home: 'Пошук',
      tickets: 'Квитки',
      profile: 'Профіль',
      settings: 'Налаштування',
    },
    search: {
      title: 'Автобусні квитки',
      subtitle: 'Шукайте та бронюйте квитки',
      originPlaceholder: 'Звідки (оберіть зупинку)',
      destinationPlaceholder: 'Куди (оберіть пункт призначення)',
      selectOriginFirst: 'Спочатку оберіть звідки',
      selectDate: 'Оберіть дату',
      passengers: 'Кількість пасажирів',
      searchButton: 'Знайти рейси',
      popularRoutes: 'Популярні маршрути',
      priceFrom: 'від',
      whereFrom: 'Звідки їдете?',
      whereTo: 'Куди їдете?',
    },
    results: {
      title: 'Результати пошуку',
      noTrips: 'Рейсів не знайдено',
      tryDifferentCriteria: 'Спробуйте змінити критерії пошуку',
      departure: 'Відправлення',
      arrival: 'Прибуття',
      duration: 'Тривалість',
      seatsAvailable: 'вільних місць',
      soldOut: 'Розпродано',
      bookNow: 'Забронювати',
      filters: 'Фільтри',
      sortBy: 'Сортувати за',
      cheapest: 'Найдешевші',
      fastest: 'Найшвидші',
      earliest: 'Найраніше',
      latest: 'Найпізніше',
    },
    booking: {
      title: 'Бронювання',
      tripDetails: 'Деталі поїздки',
      passengerDetails: 'Дані пасажира',
      firstName: "Ім'я",
      lastName: 'Прізвище',
      email: 'Електронна пошта',
      phone: 'Телефон',
      selectSeat: 'Оберіть місце',
      selectedSeats: 'Обрані місця',
      paymentMethod: 'Спосіб оплати',
      termsAccept: 'Я погоджуюсь з',
      termsLink: 'умовами використання',
      bookButton: 'Завершити бронювання',
      processing: 'Обробка...',
      successTitle: 'Бронювання завершено!',
      successMessage: 'Ваші квитки надіслано на електронну пошту.',
      errorTitle: 'Помилка бронювання',
      errorMessage: 'Під час бронювання сталася помилка. Будь ласка, спробуйте ще раз.',
      pricePerPerson: 'Ціна за особу',
      totalPrice: 'Загальна вартість',
    },
    payment: {
      title: 'Оплата',
      selectMethod: 'Оберіть спосіб оплати',
      card: 'Банківська картка',
      cash: 'Готівкою водієві',
      monobank: 'Monobank',
      liqpay: 'LiqPay',
      applePay: 'Apple Pay',
      googlePay: 'Google Pay',
      processing: 'Обробка платежу...',
      success: 'Оплата успішна!',
      failed: 'Оплата не вдалася',
      cancelled: 'Оплату скасовано',
      payNow: 'Оплатити зараз',
      payOnBoard: 'Оплата на місці',
      redirecting: 'Перенаправлення на платіжний шлюз...',
      confirmCash: 'Підтвердити оплату готівкою',
      cashNote: 'Ви оплатите безпосередньо водієві при посадці в автобус.',
    },
    tickets: {
      title: 'Мої квитки',
      active: 'Активні',
      past: 'Історія',
      noTickets: 'Немає квитків',
      bookFirst: 'У вас ще немає квитків. Забронюйте свою першу поїздку!',
      ticketNumber: 'Номер квитка',
      passenger: 'Пасажир',
      seat: 'Місце',
      status: 'Статус',
      confirmed: 'Підтверджено',
      pending: 'Очікує оплати',
      cancelled: 'Скасовано',
      used: 'Використано',
      downloadPdf: 'Завантажити PDF',
      showQr: 'Показати QR-код',
      addToWallet: 'Додати в Wallet',
    },
    profile: {
      title: 'Мій профіль',
      guest: 'Гість',
      signIn: 'Увійти',
      signOut: 'Вийти',
      signOutConfirm: 'Ви впевнені, що хочете вийти?',
      myTickets: 'Мої квитки',
      myBookings: 'Мої бронювання',
      favorites: 'Обрані',
      paymentHistory: 'Історія платежів',
      personalInfo: 'Особисті дані',
      editProfile: 'Редагувати профіль',
      deleteAccount: 'Видалити акаунт',
      deleteAccountConfirm: 'Ви впевнені, що хочете видалити свій акаунт? Цю дію неможливо скасувати.',
    },
    auth: {
      signInTitle: 'Вхід',
      signUpTitle: 'Реєстрація',
      email: 'Електронна пошта',
      password: 'Пароль',
      confirmPassword: 'Підтвердження пароля',
      forgotPassword: 'Забули пароль?',
      signInButton: 'Увійти',
      signUpButton: 'Зареєструватися',
      orContinueWith: 'або продовжити через',
      google: 'Google',
      facebook: 'Facebook',
      apple: 'Apple',
      noAccount: 'Немає акаунту?',
      hasAccount: 'Вже є акаунт?',
      magicLink: 'Вхід за посиланням',
      sendMagicLink: 'Надіслати посилання для входу',
      magicLinkSent: 'Посилання надіслано!',
      checkEmail: 'Перевірте електронну пошту та натисніть на посилання для входу.',
      twoFactor: 'Двофакторна автентифікація',
      enterCode: 'Введіть код з додатка',
      resendCode: 'Надіслати знову',
      verifyButton: 'Підтвердити',
      invalidCredentials: 'Невірні облікові дані',
      networkError: "Помилка мережі. Перевірте з'єднання.",
    },
    settings: {
      title: 'Налаштування',
      appearance: 'Зовнішній вигляд',
      darkMode: 'Темний режим',
      light: 'Світлий',
      dark: 'Темний',
      system: 'Системний',
      language: 'Мова',
      notifications: 'Сповіщення',
      notificationsDesc: 'Керувати налаштуваннями сповіщень',
      syncStatus: 'Статус синхронізації',
      offline: "Офлайн - Зміни синхронізуються після з'єднання",
      synced: 'Все синхронізовано',
      pending: 'очікуючих дій',
      forceSync: 'Примусова синхронізація',
      backend: 'Налаштування бекенду',
      currentBackend: 'Поточний бекенд',
      changeBackend: 'Змінити бекенд',
      connect: "З'єднати",
      connecting: "З'єднання...",
      legal: 'Правова інформація',
      privacyPolicy: 'Політика конфіденційності',
      termsOfService: 'Умови використання',
      about: 'Про додаток',
      appName: 'Назва додатка',
      version: 'Версія',
      developer: 'Розробник',
      resetSettings: 'Скинути до стандартних',
      resetConfirm: 'Це скине всі налаштування до стандартних. Продовжити?',
      reset: 'Скинути',
    },
    notifications: {
      title: 'Сповіщення',
      pushEnabled: 'Push-сповіщення увімкнені',
      pushDisabled: 'Push-сповіщення вимкнені',
      enablePush: 'Увімкнути push-сповіщення',
      tripReminders: 'Нагадування про поїздку',
      tripRemindersDesc: 'Нагадати про поїздку за день та за годину до відправлення',
      promoOffers: 'Акційні пропозиції',
      promoOffersDesc: 'Отримувати спеціальні пропозиції та знижки',
      priceAlerts: 'Сповіщення про ціни',
      priceAlertsDesc: 'Повідомляти про зміну цін на обраних маршрутах',
      scheduleChanges: 'Зміни в розкладі',
      scheduleChangesDesc: 'Повідомляти про затримки або зміни в розкладі',
      soundEnabled: 'Звук',
      vibrationEnabled: 'Вібрація',
    },
    errors: {
      generic: 'Щось пішло не так',
      network: "Помилка мережі. Перевірте з'єднання з інтернетом.",
      serverError: 'Помилка сервера. Будь ласка, спробуйте пізніше.',
      notFound: 'Запитаний елемент не знайдено.',
      unauthorized: 'У вас немає дозволу на цю дію.',
      sessionExpired: 'Ваша сесія закінчилась. Будь ласка, увійдіть знову.',
      invalidInput: 'Невірні дані. Перевірте введену інформацію.',
      paymentFailed: 'Оплата не вдалася. Будь ласка, спробуйте ще раз.',
      bookingFailed: 'Бронювання не вдалося. Будь ласка, спробуйте ще раз.',
      tryAgain: 'Спробувати знову',
    },
    datetime: {
      today: 'Сьогодні',
      tomorrow: 'Завтра',
      yesterday: 'Вчора',
      minutes: 'хв',
      hours: 'год',
      days: 'днів',
      ago: 'тому',
      in: 'через',
    },
  },
};

// Language display names
export const languageNames: Record<SupportedLanguage, string> = {
  cs: 'Čeština',
  en: 'English',
  uk: 'Українська',
};

// Language flags
export const languageFlags: Record<SupportedLanguage, string> = {
  cs: '🇨🇿',
  en: '🇬🇧',
  uk: '🇺🇦',
};

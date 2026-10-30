/**
 * Lightweight i18n: a dictionary per language, a React context, and RTL for Arabic.
 * The chosen language is stored in localStorage and applied after hydration.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const LANGS = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "it", label: "Italiano", flag: "🇮🇹" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
  { code: "ms", label: "Bahasa Melayu", flag: "🇲🇾" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇵🇹" },
] as const;
export type Lang = (typeof LANGS)[number]["code"];

const en = {
  createVoice: "Create voice",
  shareStory: "Share your story, your voice",
  storiesFrom: "Unspoken feelings & stories from",
  noStories: "No stories here yet",
  beFirst: "Be the first voice from your country.",
  loadError: "Couldn't load stories.",
  all: "All", love: "Love", life: "Life", friendship: "Friendship", negative: "Negative Behaviors",
  freedom: "Freedom", family: "Family", other: "Other",
  like: "Like", support: "Support", save: "Save", saved: "Saved", more: "More",
  report: "Report this story", share: "Share to other platforms", linkCopied: "Link copied",
  reportTitle: "Report this story", reportReason: "Why are you reporting it?", send: "Send report",
  reported: "Thanks — our team will review it", you: "You", anonymous: "Anonymous",
  myStories: "My stories", noMine: "You haven't published anything yet.",
  likesReceived: "Likes received", plays: "Plays", stories: "Stories",
  credits: "Credit balance", buyCredits: "Upgrade / Buy credits", signOut: "Sign out",
  premium: "Premium", free: "Free", account: "account", activeUntil: "Active until", noMembership: "No active membership",
  language: "Language", ad: "Sponsored", soon: "Coming soon", deleteConfirm: "Delete this story?",
  home: "Home", messages: "Messages", profile: "Profile", notifications: "Notifications", search: "Search",
};
type Dict = typeof en;

const DICTS: Record<Lang, Partial<Dict>> = {
  en,
  fr: { createVoice: "Créer une voix", shareStory: "Partagez votre histoire, votre voix", storiesFrom: "Sentiments et histoires de", noStories: "Aucune histoire pour l'instant", beFirst: "Soyez la première voix de votre pays.", all: "Tout", love: "Amour", life: "Vie", friendship: "Amitié", negative: "Comportements négatifs", freedom: "Liberté", family: "Famille", other: "Autre", like: "J'aime", support: "Soutenir", save: "Enregistrer", saved: "Enregistré", more: "Plus", report: "Signaler cette histoire", share: "Partager sur d'autres plateformes", linkCopied: "Lien copié", reportTitle: "Signaler cette histoire", reportReason: "Pourquoi la signalez-vous ?", send: "Envoyer", reported: "Merci — notre équipe va vérifier", you: "Vous", anonymous: "Anonyme", myStories: "Mes histoires", noMine: "Vous n'avez encore rien publié.", likesReceived: "J'aime reçus", plays: "Écoutes", stories: "Histoires", credits: "Solde de crédits", buyCredits: "Améliorer / Acheter des crédits", signOut: "Déconnexion", language: "Langue", ad: "Sponsorisé", soon: "Bientôt disponible", home: "Accueil", messages: "Messages", profile: "Profil" },
  it: { createVoice: "Crea voce", shareStory: "Condividi la tua storia, la tua voce", storiesFrom: "Sentimenti e storie da", noStories: "Ancora nessuna storia", beFirst: "Sii la prima voce del tuo paese.", all: "Tutto", love: "Amore", life: "Vita", friendship: "Amicizia", negative: "Comportamenti negativi", freedom: "Libertà", family: "Famiglia", other: "Altro", like: "Mi piace", support: "Supporta", save: "Salva", saved: "Salvato", more: "Altro", report: "Segnala questa storia", share: "Condividi su altre piattaforme", linkCopied: "Link copiato", send: "Invia", you: "Tu", anonymous: "Anonimo", myStories: "Le mie storie", likesReceived: "Mi piace ricevuti", plays: "Ascolti", stories: "Storie", credits: "Saldo crediti", buyCredits: "Upgrade / Compra crediti", signOut: "Esci", language: "Lingua", ad: "Sponsorizzato", home: "Home", messages: "Messaggi", profile: "Profilo" },
  ru: { createVoice: "Создать голос", shareStory: "Поделитесь историей своим голосом", storiesFrom: "Невысказанные чувства и истории из", noStories: "Пока нет историй", beFirst: "Станьте первым голосом своей страны.", all: "Все", love: "Любовь", life: "Жизнь", friendship: "Дружба", negative: "Негативное поведение", freedom: "Свобода", family: "Семья", other: "Другое", like: "Нравится", support: "Поддержать", save: "Сохранить", saved: "Сохранено", more: "Ещё", report: "Пожаловаться", share: "Поделиться", linkCopied: "Ссылка скопирована", send: "Отправить", you: "Вы", anonymous: "Аноним", myStories: "Мои истории", likesReceived: "Получено лайков", plays: "Прослушивания", stories: "Истории", credits: "Баланс кредитов", buyCredits: "Улучшить / Купить кредиты", signOut: "Выйти", language: "Язык", ad: "Реклама", home: "Главная", messages: "Сообщения", profile: "Профиль" },
  ms: { createVoice: "Cipta suara", shareStory: "Kongsi kisah anda, suara anda", storiesFrom: "Perasaan & kisah dari", noStories: "Belum ada kisah", beFirst: "Jadilah suara pertama negara anda.", all: "Semua", love: "Cinta", life: "Kehidupan", friendship: "Persahabatan", negative: "Tingkah laku negatif", freedom: "Kebebasan", family: "Keluarga", other: "Lain", like: "Suka", support: "Sokong", save: "Simpan", saved: "Disimpan", more: "Lagi", report: "Laporkan kisah ini", share: "Kongsi ke platform lain", send: "Hantar", you: "Anda", anonymous: "Tanpa nama", myStories: "Kisah saya", plays: "Main", stories: "Kisah", credits: "Baki kredit", buyCredits: "Naik taraf / Beli kredit", signOut: "Log keluar", language: "Bahasa", ad: "Ditaja", home: "Utama", messages: "Mesej", profile: "Profil" },
  ja: { createVoice: "声を作成", shareStory: "あなたの声で物語を", storiesFrom: "言葉にできない気持ちと物語：", noStories: "まだ物語がありません", beFirst: "あなたの国で最初の声になろう。", all: "すべて", love: "恋愛", life: "人生", friendship: "友情", negative: "ネガティブな行動", freedom: "自由", family: "家族", other: "その他", like: "いいね", support: "応援", save: "保存", saved: "保存済み", more: "その他", report: "この物語を報告", share: "他のアプリで共有", linkCopied: "リンクをコピーしました", send: "送信", you: "あなた", anonymous: "匿名", myStories: "私の物語", likesReceived: "受け取ったいいね", plays: "再生数", stories: "物語", credits: "クレジット残高", buyCredits: "アップグレード / クレジット購入", signOut: "ログアウト", language: "言語", ad: "広告", home: "ホーム", messages: "メッセージ", profile: "プロフィール" },
  ar: { createVoice: "أنشئ صوتك", shareStory: "شارك قصتك بصوتك", storiesFrom: "مشاعر وقصص من", noStories: "لا توجد قصص بعد", beFirst: "كن أول صوت من بلدك.", all: "الكل", love: "حب", life: "حياة", friendship: "صداقة", negative: "سلوكيات سلبية", freedom: "حرية", family: "عائلة", other: "أخرى", like: "إعجاب", support: "دعم", save: "حفظ", saved: "محفوظ", more: "المزيد", report: "الإبلاغ عن القصة", share: "مشاركة على منصات أخرى", linkCopied: "تم نسخ الرابط", reportTitle: "الإبلاغ عن القصة", reportReason: "لماذا تبلغ عنها؟", send: "إرسال", reported: "شكرًا — سيراجعها فريقنا", you: "أنت", anonymous: "مجهول", myStories: "قصصي", noMine: "لم تنشر شيئًا بعد.", likesReceived: "الإعجابات", plays: "الاستماعات", stories: "القصص", credits: "رصيد العملات", buyCredits: "ترقية / شراء عملات", signOut: "تسجيل الخروج", language: "اللغة", ad: "إعلان", soon: "قريبًا", home: "الرئيسية", messages: "الرسائل", profile: "الملف" },
  es: { createVoice: "Crear voz", shareStory: "Comparte tu historia, tu voz", storiesFrom: "Sentimientos e historias de", noStories: "Aún no hay historias", beFirst: "Sé la primera voz de tu país.", all: "Todo", love: "Amor", life: "Vida", friendship: "Amistad", negative: "Conductas negativas", freedom: "Libertad", family: "Familia", other: "Otro", like: "Me gusta", support: "Apoyar", save: "Guardar", saved: "Guardado", more: "Más", report: "Denunciar historia", share: "Compartir en otras plataformas", linkCopied: "Enlace copiado", send: "Enviar", you: "Tú", anonymous: "Anónimo", myStories: "Mis historias", likesReceived: "Me gusta recibidos", plays: "Reproducciones", stories: "Historias", credits: "Saldo de créditos", buyCredits: "Mejorar / Comprar créditos", signOut: "Cerrar sesión", language: "Idioma", ad: "Patrocinado", home: "Inicio", messages: "Mensajes", profile: "Perfil" },
  pt: { createVoice: "Criar voz", shareStory: "Partilhe a sua história, a sua voz", storiesFrom: "Sentimentos e histórias de", noStories: "Ainda sem histórias", beFirst: "Seja a primeira voz do seu país.", all: "Tudo", love: "Amor", life: "Vida", friendship: "Amizade", negative: "Comportamentos negativos", freedom: "Liberdade", family: "Família", other: "Outro", like: "Gosto", support: "Apoiar", save: "Guardar", saved: "Guardado", more: "Mais", report: "Denunciar história", share: "Partilhar noutras plataformas", linkCopied: "Link copiado", send: "Enviar", you: "Você", anonymous: "Anónimo", myStories: "As minhas histórias", likesReceived: "Gostos recebidos", plays: "Reproduções", stories: "Histórias", credits: "Saldo de créditos", buyCredits: "Melhorar / Comprar créditos", signOut: "Sair", language: "Idioma", ad: "Patrocinado", home: "Início", messages: "Mensagens", profile: "Perfil" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof Dict) => string };
const I18nCtx = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => en[k] });

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const saved = localStorage.getItem("whisly-lang") as Lang | null;
    const nav = navigator.language.slice(0, 2) as Lang;
    const pick = saved ?? (LANGS.some((l) => l.code === nav) ? nav : "en");
    setLangState(pick);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    localStorage.setItem("whisly-lang", l);
    setLangState(l);
  }, []);
  const t = useCallback((k: keyof Dict) => DICTS[lang][k] ?? en[k], [lang]);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export const useI18n = () => useContext(I18nCtx);

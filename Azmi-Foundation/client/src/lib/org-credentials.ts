export const ORG_CREDENTIALS = {
  name: "AZMI FOUNDATION",
  pan: "AAGTA9354B",
  // 80G
  reg80G: "AAGTA9354BF20261",
  valid80G: "AY 2026-27 to AY 2028-29",
  approval80G: "06-04-2026",
  // 12A
  reg12A: "AAGTA9354BE2025101",
  // CSR-1
  csr1: "CSR00108803",
  // NGO Darpan
  darpanId: "GJ/2021/0276308",
  // Trust
  trustReg: "E/22280/AHMEDABAD",
  estd: "23-07-2018",
  // Contact
  address: "1962/8 Magan Kumbhar Ni Chali, Gomtipur, Ahmedabad – 380021, Gujarat",
  email: "azmifoundation786@gmail.com",
  phone: "8320218861",
  upi: "8320218861@okbizaxis",
};

export const CREDENTIALS_LIST = [
  {
    label: "80G Tax Exemption",
    value: ORG_CREDENTIALS.reg80G,
    sub: `Valid: ${ORG_CREDENTIALS.valid80G}`,
    color: "amber",
    icon: "📜",
  },
  {
    label: "12A Income Tax Exemption",
    value: ORG_CREDENTIALS.reg12A,
    sub: "Registered under IT Act 1961",
    color: "blue",
    icon: "🏛️",
  },
  {
    label: "CSR-1 Registration",
    value: ORG_CREDENTIALS.csr1,
    sub: "Ministry of Corporate Affairs",
    color: "green",
    icon: "🤝",
  },
  {
    label: "NGO Darpan ID",
    value: ORG_CREDENTIALS.darpanId,
    sub: "NITI Aayog, Govt. of India",
    color: "purple",
    icon: "🇮🇳",
  },
  {
    label: "PAN Number",
    value: ORG_CREDENTIALS.pan,
    sub: "Income Tax Department",
    color: "gray",
    icon: "🪪",
  },
  {
    label: "Trust Registration",
    value: ORG_CREDENTIALS.trustReg,
    sub: `Estd. ${ORG_CREDENTIALS.estd} | Charity Commissioner`,
    color: "rose",
    icon: "⚖️",
  },
];

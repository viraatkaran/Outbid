export const BRAND = process.env.NEXT_PUBLIC_BRAND_NAME || "BillboardRank";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const TAGLINE = "The world ranking for businesses. Bid by category, country or worldwide, and see verified clicks.";

export const MAX_BID_CENTS = 1_000_000;

export const CATEGORY_GROUPS: { name: string; items: { slug: string; label: string }[] }[] = [
  { name: "AI & Software", items: [
    ["ai-agents", "AI Agents"], ["ai-writing", "AI Writing"], ["ai-image-video", "AI Image & Video"], ["dev-tools", "Dev Tools"],
    ["productivity", "Productivity"], ["sales-crm", "Sales & CRM"], ["support", "Customer Support"], ["data-analytics", "Data & Analytics"],
    ["no-code", "No-code"], ["saas", "SaaS"], ["it-services", "IT Services"], ["software-dev", "Software Development"],
    ["web-design", "Web Design & Development"], ["mobile-apps", "Mobile Apps"], ["cybersecurity", "Cybersecurity"], ["cloud-hosting", "Cloud & Hosting"],
    ["telecom", "Telecom & Internet"], ["hardware", "Hardware & Electronics"], ["gaming", "Gaming"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Marketing & Media", items: [
    ["marketing-seo", "Marketing & SEO"], ["marketing-agency", "Marketing Agencies"], ["social-media", "Social Media"], ["advertising", "Advertising"],
    ["pr", "Public Relations"], ["content-writing", "Content & Copywriting"], ["video-production", "Video Production"], ["photography", "Photography"],
    ["design", "Design & Branding"], ["printing", "Printing & Signage"], ["events", "Events & Weddings"], ["media-publishing", "Media & Publishing"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Home & Trades", items: [
    ["plumbing", "Plumbing"], ["electrician", "Electricians"], ["hvac", "Heating & Cooling"], ["roofing", "Roofing"], ["painting", "Painting & Decorating"],
    ["carpentry", "Carpentry & Joinery"], ["landscaping", "Landscaping & Gardening"], ["cleaning", "Cleaning Services"], ["pest-control", "Pest Control"],
    ["locksmith", "Locksmiths"], ["moving", "Moving & Removals"], ["handyman", "Handyman"], ["construction", "Construction & Building"],
    ["architecture", "Architecture"], ["interior-design", "Interior Design"], ["real-estate", "Real Estate"], ["property-management", "Property Management"],
    ["solar-energy", "Solar & Energy"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Professional Services", items: [
    ["legal", "Legal"], ["accounting", "Accounting & Tax"], ["consulting", "Consulting"], ["recruitment", "Recruitment & HR"], ["insurance", "Insurance"],
    ["banking-finance", "Banking & Finance"], ["investment", "Investment & Wealth"], ["translation", "Translation"], ["business-services", "Business Services"],
    ["coworking", "Coworking & Offices"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Health & Wellness", items: [
    ["healthcare", "Clinics & Healthcare"], ["dental", "Dental"], ["pharmacy", "Pharmacy"], ["mental-health", "Mental Health"], ["fitness", "Fitness & Gyms"],
    ["beauty", "Beauty & Hair Salons"], ["spa-wellness", "Spa & Wellness"], ["veterinary", "Veterinary"], ["nutrition", "Nutrition"], ["optical", "Optical"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Food & Hospitality", items: [
    ["restaurants", "Restaurants"], ["cafes", "Cafes & Coffee"], ["bakeries", "Bakeries"], ["catering", "Catering"], ["bars-nightlife", "Bars & Nightlife"],
    ["hotels", "Hotels & Stays"], ["travel-agencies", "Travel Agencies"], ["tourism", "Tours & Activities"], ["food-delivery", "Food Delivery"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Retail & E-commerce", items: [
    ["ecommerce", "E-commerce Stores"], ["fashion", "Fashion & Apparel"], ["jewelry", "Jewelry"], ["furniture", "Furniture & Home"], ["groceries", "Groceries"],
    ["electronics-retail", "Electronics Retail"], ["gifts-flowers", "Gifts & Flowers"], ["sports-outdoors", "Sports & Outdoors"], ["toys-kids", "Toys & Kids"], ["pets", "Pet Supplies"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Automotive & Transport", items: [
    ["auto-repair", "Auto Repair"], ["car-dealers", "Car Dealers"], ["car-rental", "Car Rental"], ["logistics", "Logistics & Delivery"], ["ride-taxi", "Taxi & Rideshare"],
    ["aviation", "Aviation"], ["shipping-freight", "Shipping & Freight"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Education", items: [
    ["schools", "Schools"], ["tutoring", "Tutoring"], ["universities", "Universities & Colleges"], ["online-courses", "Online Courses"], ["languages", "Language Learning"],
    ["childcare", "Childcare"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Industry & Agriculture", items: [
    ["manufacturing", "Manufacturing"], ["agriculture", "Agriculture"], ["mining-energy", "Mining & Energy"], ["chemicals", "Chemicals"], ["packaging", "Packaging"],
    ["wholesale", "Wholesale & Trade"], ["machinery", "Machinery & Equipment"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Finance Tech & Web3", items: [
    ["crypto-web3", "Crypto & Web3"], ["fintech", "Fintech"], ["payments", "Payments"],
  ].map(([slug, label]) => ({ slug, label })) },
  { name: "Community & Other", items: [
    ["nonprofits", "Nonprofits & Charities"], ["religious", "Religious Organisations"], ["government", "Government & Public"], ["sports-clubs", "Sports Clubs"],
    ["entertainment", "Entertainment"], ["music", "Music"], ["art", "Art & Culture"], ["other", "Other"],
  ].map(([slug, label]) => ({ slug, label })) },
];

export const CATEGORIES = CATEGORY_GROUPS.flatMap((g) => g.items);

export type CategorySlug = string;
export const categoryLabel = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
export const isCategory = (s: string): s is CategorySlug => CATEGORIES.some((c) => c.slug === s);

export const fmtUsd = (cents: number) =>
  "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });

import { Link, useRoute } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight, Clock, ArrowLeft } from "lucide-react";

export const BLOG_POSTS = [
  {
    slug: "how-to-calculate-zakat-on-savings",
    title: "How to Calculate Zakat on Savings: A Complete 2026 Guide",
    date: "April 10, 2026",
    readTime: "8 min read",
    category: "Zakat",
    excerpt: "A step-by-step guide to calculating Zakat on your savings, gold, investments, and business assets using the gold Nisab standard for 2026.",
    content: `
Zakat is one of the Five Pillars of Islam — an obligatory annual purification of wealth. If your net assets exceed the Nisab threshold for a full lunar year, you must pay 2.5% as Zakat.

## What Is Nisab?

Nisab is the minimum wealth threshold. For 2026 in India:
- **Gold Nisab:** 87.48 grams × ₹7,200/g = approximately ₹6,29,856
- **Silver Nisab:** 612.36 grams × ₹85/g = approximately ₹52,050

Scholars recommend using the **silver Nisab** as it is lower and captures more people's obligation. However, most modern scholars and institutions now use the gold Nisab for savings and investments.

## What Assets Are Zakatable?

| Asset Type | Zakatable? |
|---|---|
| Cash (at home or bank) | Yes |
| Savings & fixed deposits | Yes |
| Gold & silver jewellery | Yes (if above Nisab) |
| Stocks & mutual funds | Yes (market value) |
| Business inventory | Yes |
| Property for investment | Yes (market value) |
| Primary home | No |
| Car for personal use | No |
| Debts owed to you | Yes |

## Step-by-Step Calculation

**Step 1:** Add up all zakatable assets:
- Cash + Savings + Value of gold + Value of silver + Investments + Business goods + Money owed to you

**Step 2:** Subtract all debts you owe:
- Loans + Monthly bills due + Outstanding payments

**Step 3:** Check if net amount ≥ Nisab

**Step 4:** If yes, multiply net total × 2.5%

## Worked Example

Raza has:
- Savings: ₹3,00,000
- Gold jewellery: 50g × ₹7,200 = ₹3,60,000
- Investments: ₹1,00,000
- Car loan EMI outstanding: ₹80,000

Net Zakatable Wealth = ₹3,00,000 + ₹3,60,000 + ₹1,00,000 − ₹80,000 = **₹6,80,000**

This exceeds the Nisab of ₹6,29,856 (gold standard).

**Zakat Due = ₹6,80,000 × 2.5% = ₹17,000**

## Use Our Zakat Calculator

Visit our [Zakat Calculator page](/zakat) to calculate your exact Zakat amount in seconds. Then donate directly to Azmi Foundation — your Zakat will feed 25 families in Ahmedabad for a week.

## Frequently Asked Questions

**Can I pay Zakat in installments?**
Yes. You may pay Zakat in monthly installments as long as the total reaches your due amount by the end of the lunar year.

**What if I cannot afford to pay my full Zakat at once?**
Zakat is your obligation. You may spread payments, but you cannot delay it indefinitely. Paying early is encouraged.

**Can I give Zakat to a family member?**
You may give Zakat to siblings, aunts, uncles, or cousins if they are eligible. You cannot give Zakat to your parents, spouse, or children.
    `,
  },
  {
    slug: "what-is-sadaqah-jariyah",
    title: "What Is Sadaqah Jariyah? The 7 Best Causes in Islam",
    date: "April 8, 2026",
    readTime: "6 min read",
    category: "Sadaqah",
    excerpt: "Sadaqah Jariyah is continuous charity — good deeds whose reward flows even after death. Learn the 7 best causes and how to give in Islam.",
    content: `
The Prophet Muhammad ﷺ said:

*"When a person dies, their deeds come to an end except for three: Sadaqah Jariyah, beneficial knowledge, or a righteous child who prays for them."*
— Sahih Muslim 1631

This hadith defines one of the most powerful concepts in Islamic giving: **Sadaqah Jariyah** — charity that continues to earn reward even after you leave this world.

## What Is Sadaqah Jariyah?

The word *Sadaqah* (صدقة) means charity. *Jariyah* (جارية) means "flowing" or "continuous." Together, Sadaqah Jariyah refers to any charitable act whose benefits continue after the giver's death.

While regular Sadaqah earns reward once, Sadaqah Jariyah multiplies your reward for as long as the benefit lasts.

## The 7 Best Causes of Sadaqah Jariyah

### 1. Feeding the Hungry
Allah says in the Quran: *"Or feeding on a day of severe hunger — an orphan of near relationship, or a needy person in misery."* (Surah Al-Balad 90:14-16)

Feeding people is among the most directly commanded acts of charity in the Quran. Every meal you fund at Azmi Foundation — where ₹680 feeds one family — is an act of Sadaqah Jariyah.

### 2. Building a Well or Water Source
The Prophet ﷺ was asked: "Which charity is best?" He replied: "Giving water." (Ibn Majah)

Funding clean water access for communities earns reward every time someone drinks from it.

### 3. Building a Mosque
Every prayer prayed in a mosque you helped build earns you reward. Even the smallest contribution to constructing or maintaining a place of worship counts.

### 4. Funding Islamic Education
Teaching Quran, funding Islamic schools, sponsoring students — every good deed performed by those you educated flows back to you.

### 5. Planting a Tree
The Prophet ﷺ said: *"If a Muslim plants a tree or sows seeds, and then a bird, or a person, or an animal eats from it, it is regarded as a charitable gift (Sadaqah) for him."* (Bukhari)

### 6. Supporting Orphans
*"I and the caretaker of an orphan will be in Paradise like this,"* said the Prophet ﷺ, joining his index and middle fingers. (Bukhari)

### 7. Righteous Children
Raising children who remember you in prayer after your death is the longest-lasting form of Sadaqah Jariyah.

## How to Give Sadaqah Jariyah Through Azmi Foundation

Your Sadaqah goes to:
- **Daily food** for 2,000+ people in Ahmedabad
- **Grocery kits** for 846 families (₹680 per kit)
- **Education support** for underprivileged children
- **Healthcare outreach** for families who cannot afford treatment

[Give Sadaqah Jariyah now →](/donate)

Your donation earns 80G tax exemption and an auto-generated receipt.
    `,
  },
  {
    slug: "importance-of-islamic-education",
    title: "Islamic Education: Why It Is the Foundation of Every Muslim Life",
    date: "April 5, 2026",
    readTime: "7 min read",
    category: "Education",
    excerpt: "The Quran's first command was 'Read.' Islamic education is not optional — it is the foundation of every Muslim's duty to Allah and community.",
    content: `
The very first word revealed to Prophet Muhammad ﷺ was **Iqra — "Read."**

Not "pray." Not "fast." Not "give Zakat." The first divine command was an instruction to seek knowledge. This tells us everything about Islam's relationship with education.

## The Islamic Duty to Seek Knowledge

The Prophet ﷺ said: *"Seeking knowledge is an obligation upon every Muslim."* (Ibn Majah)

This hadith — authenticated by scholars — makes education not a choice, but a religious duty. Every Muslim man and woman is commanded to pursue knowledge: knowledge of Allah, of His commands, of their faith, and of the world.

## The Crisis of Islamic Education Today

Across India, millions of Muslim children grow up without access to:
- Quality religious education (Quran, Hadith, Islamic jurisprudence)
- Basic literacy and numeracy
- Secondary and higher education opportunities

Poverty is the primary barrier. Families in Ahmedabad's slums cannot afford school fees, books, uniforms, or transportation. Children who should be learning are working instead.

## What Azmi Foundation Does

At Azmi Foundation, we believe that feeding a child is the first step to educating one. A hungry child cannot learn. By providing daily food and grocery kits to 846 families, we remove the barrier of hunger so children can attend school.

We also support:
- **School fee assistance** for underprivileged children
- **Book and material supplies** for students
- **Quran education** for children who cannot access madrasa

## The Reward for Supporting Islamic Education

The Prophet ﷺ said: *"Whoever guides someone to goodness will have a reward similar to the one who does it."* (Muslim)

When you fund a child's education, every good deed they do — every prayer they pray with the knowledge they gained — earns you reward.

[Support education at Azmi Foundation →](/donate)
    `,
  },
  {
    slug: "ramadan-charity-giving-guide",
    title: "Ramadan Charity: The Complete Guide to Giving in the Holy Month",
    date: "March 20, 2026",
    readTime: "10 min read",
    category: "Ramadan",
    excerpt: "Ramadan multiplies the reward of every good deed. Learn how to maximize your charity — Zakat, Sadaqah, Zakat al-Fitr — during the holiest month.",
    content: `
Ramadan is the holiest month in the Islamic calendar — a time when rewards for good deeds are multiplied manifold. The Prophet ﷺ was described as being "more generous than the blowing wind" during Ramadan.

*"Whoever draws near to Allah with a good deed in Ramadan is like one who performs an obligatory deed at other times."* (Ibn Khuzaymah)

## Why Giving in Ramadan Is Different

Allah opens all the doors of Paradise and closes the doors of Hell in Ramadan. The reward for every act of worship is multiplied. Many scholars hold that Sadaqah in Ramadan earns the reward of Sadaqah Jariyah — continuous reward.

The Prophet ﷺ combined fasting with extraordinary generosity. He increased his giving dramatically during the holy month.

## Types of Charity in Ramadan

### 1. Zakat (Obligatory Annual Charity)
Many Muslims choose to pay their annual Zakat during Ramadan to maximize its reward. If your Zakat was due, paying it in Ramadan is encouraged but not required.

[Calculate your Zakat →](/zakat)

### 2. Zakat al-Fitr (Obligatory before Eid)
Every Muslim who is not in poverty must pay Zakat al-Fitr before the Eid prayer for themselves and their dependents.

- Amount: Approximately ₹80-100 per person (local wheat/rice equivalent)
- Due: Before the Eid al-Fitr prayer
- Purpose: To ensure every poor person can celebrate Eid

### 3. Sadaqah (Voluntary Charity)
Give as much voluntary Sadaqah as you can during Ramadan. Even a smile is Sadaqah — but financial giving in Ramadan multiplies enormously.

### 4. Feeding Fasting People (Iftar)
*"Whoever provides the food for a fasting person to break their fast with will have the same reward as him, without the fasting person's reward being diminished in any way."* (Tirmidhi)

Funding Iftar meals for families is among the highest acts of Ramadan charity.

## How to Maximize Your Ramadan Giving at Azmi Foundation

At Azmi Foundation, your Ramadan Sadaqah funds:
- **Daily Iftar meals** for 2,000+ people in Ahmedabad
- **Grocery kits** for 846 families — ₹680 per family
- **Eid food parcels** for families who cannot afford Eid celebrations

### The Last 10 Nights — Laylat al-Qadr

The last 10 nights of Ramadan contain Laylat al-Qadr — the Night of Power — worth more than 1,000 months of worship.

*"Indeed, We sent the Quran down during the Night of Power. And what can make you know what is the Night of Power? The Night of Power is better than a thousand months."* (Quran 97:1-3)

Give generously every night of the last 10 to ensure you do not miss it.

[Donate for Ramadan →](/donate) | [Give Zakat →](/zakat)

## Planning Your Ramadan Giving

1. Calculate your Zakat and plan to pay it in Ramadan
2. Set a daily Sadaqah amount — even ₹10/day adds up
3. Sponsor Iftar for a family (₹680 covers one family's groceries)
4. Pay Zakat al-Fitr before Eid prayers
5. Give extra in the last 10 nights, especially on odd nights

JazakAllahu Khayran. May Allah accept your Ramadan worship and charity.
    `,
  },
];

function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const post = BLOG_POSTS.find(p => p.slug === params?.slug);

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-black text-primary uppercase">Article Not Found</h2>
            <Link href="/blog"><Button className="rounded-none">Back to Blog</Button></Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const paragraphs = post.content.trim().split("\n");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />
      <div className="bg-white border-b border-gray-100 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Link href="/" className="hover:text-primary">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-primary font-bold truncate max-w-[200px]">{post.title}</span>
        </div>
      </div>

      <article className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Link href="/blog" className="inline-flex items-center gap-2 text-xs text-gray-400 font-black uppercase tracking-widest hover:text-primary transition-colors">
            <ArrowLeft className="w-3 h-3" /> All Articles
          </Link>
          <div className="space-y-2">
            <span className="text-accent text-xs font-black uppercase tracking-widest">{post.category}</span>
            <h1 className="text-2xl sm:text-4xl font-black text-primary leading-tight tracking-tight">{post.title}</h1>
            <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
              <span>{post.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
            </div>
          </div>

          <div className="prose prose-sm sm:prose max-w-none text-gray-700 leading-relaxed space-y-4">
            {paragraphs.map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="text-xl font-black text-primary uppercase tracking-tight mt-8 mb-4">{line.replace("## ", "")}</h2>;
              if (line.startsWith("### ")) return <h3 key={i} className="text-base font-black text-primary uppercase tracking-tight mt-6 mb-2">{line.replace("### ", "")}</h3>;
              if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-bold text-primary">{line.replace(/\*\*/g, "")}</p>;
              if (line.startsWith("*") && line.endsWith("*")) return <p key={i} className="italic text-gray-600 border-l-4 border-accent pl-4 bg-amber-50 py-2">{line.replace(/\*/g, "")}</p>;
              if (line.startsWith("- ")) return <li key={i} className="ml-4 text-gray-600">{line.replace("- ", "")}</li>;
              if (line.startsWith("| ")) return null;
              if (line.startsWith("[") && line.includes("→")) {
                const match = line.match(/\[(.+?)\]\((.+?)\)/);
                if (match) return <p key={i}><Link href={match[2]}><span className="text-accent font-black uppercase tracking-widest text-sm hover:underline cursor-pointer">{match[1]}</span></Link></p>;
              }
              if (!line.trim()) return <br key={i} />;
              return <p key={i} className="text-gray-700 leading-relaxed">{line}</p>;
            })}
          </div>

          <div className="border-t border-gray-100 pt-8 space-y-4">
            <p className="text-sm font-black text-primary uppercase tracking-widest">Support the Cause</p>
            <p className="text-gray-600 text-sm">Azmi Foundation feeds 2,000+ people every day. ₹680 provides one family's weekly groceries. 80G tax receipts provided.</p>
            <Link href="/donate">
              <Button className="bg-primary hover:bg-black text-white font-black uppercase tracking-widest rounded-none px-8 py-5">
                Donate Now →
              </Button>
            </Link>
          </div>
        </motion.div>
      </article>

      <Footer />
    </div>
  );
}

export default function Blog() {
  const [, params] = useRoute("/blog/:slug");
  if (params?.slug) return <BlogPostPage />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Navbar />

      <section className="bg-primary text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-accent text-xs font-black uppercase tracking-[0.4em]">Knowledge & Giving</span>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight">Islamic Giving Blog</h1>
          <p className="text-white/80 text-base max-w-xl mx-auto">
            Guides on Zakat, Sadaqah Jariyah, Islamic charity, and how your donations create real impact for families in Ahmedabad.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
          {BLOG_POSTS.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-gray-100 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="space-y-1">
                <span className="text-accent text-[10px] font-black uppercase tracking-widest">{post.category}</span>
                <h2 className="text-base font-black text-primary leading-tight tracking-tight">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="hover:text-accent transition-colors cursor-pointer">{post.title}</span>
                  </Link>
                </h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">{post.excerpt}</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                  <span>{post.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                </div>
                <Link href={`/blog/${post.slug}`}>
                  <span className="text-accent font-black text-xs uppercase tracking-widest hover:underline cursor-pointer flex items-center gap-1">
                    Read <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="py-12 px-4 bg-primary text-white text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-xl font-black uppercase tracking-tight">Ready to Give?</h2>
          <p className="text-white/70 text-sm">₹680 feeds one family for a week. 846 families need your help.</p>
          <Link href="/donate">
            <Button className="bg-accent hover:bg-accent/90 text-primary font-black uppercase tracking-widest rounded-none px-8 py-5">
              Donate Now →
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}

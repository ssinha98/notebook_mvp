import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PlayIcon, StopIcon } from "@heroicons/react/24/solid";
import { Share2, Mail } from "lucide-react";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Agent, getAgentById } from "@/data/agents";
import ShareableAgentBlock from "@/components/custom_components/shareable_blocks/ShareableAgentBlock";
import ShareableWebBlock from "@/components/custom_components/shareable_blocks/ShareableWebBlock";
import ShareableContactBlock from "@/components/custom_components/shareable_blocks/ShareableContactBlock";
import ShareableCheckinBlock from "@/components/custom_components/shareable_blocks/ShareableCheckinBlock";
import { toast } from "sonner";
import ShareableExcelAgent from "@/components/custom_components/shareable_blocks/ShareableExcelAgent";
import ShareableCodeBlock from "@/components/custom_components/shareable_blocks/ShareableCodeBlock";
import ShareableMakeBlock from "@/components/custom_components/shareable_blocks/ShareableMakeBlock";
import ShareableInstagramAgent from "@/components/custom_components/shareable_blocks/ShareableInstagramAgent";
import { ShareableInstagramBlock } from "@/types/shareable_blocks";
import ShareableSearchBlock from "@/components/custom_components/shareable_blocks/ShareableSearchBlock";

// Enum for run states
enum RunState {
  NOT_STARTED = "NOT_STARTED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
}

// Update block interfaces
interface BaseShareableBlock {
  id: string;
  blockNumber: number;
  type: string;
  output?: string;
  outputVariable?: {
    name: string;
    value?: string; // This will store the output when the block is run
  };
}

interface ShareableAgentBlock extends BaseShareableBlock {
  type: "agent";
  systemPrompt?: string;
  userPrompt: string;
  attachedFile?: {
    name: string;
    type: string;
    url: string;
    content: string;
  };
}

interface ShareableContactBlock extends BaseShareableBlock {
  type: "contact";
  to: string;
  subject: string;
  body: string;
}

interface ShareableWebBlock extends BaseShareableBlock {
  type: "webagent";
  url: string;
  nickname: string;
}

interface ShareableCheckinBlock extends BaseShareableBlock {
  type: "checkin";
}

interface ShareableCodeBlock extends BaseShareableBlock {
  type: "code";
  language: string;
  code: string;
}

interface ShareableMakeBlock extends BaseShareableBlock {
  type: "make";
  webhookUrl: string;
  parameters: { key: string; value: string }[];
}

interface ShareableExcelBlock extends BaseShareableBlock {
  type: "excel";
  userPrompt: string;
}

interface ShareableSearchBlock extends BaseShareableBlock {
  type: "search";
  engine: "search" | "news" | "finance" | "markets" | "image";
  query: string;
  limit: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
  trend?: string;
  prompt?: string;
  region?: string;
  imageResults?: {
    url: string;
    title: string;
    analysisResult?: string;
  }[];
}

// Update the ShareableBlock type
type ShareableBlock =
  | ShareableAgentBlock
  | ShareableContactBlock
  | ShareableWebBlock
  | ShareableCheckinBlock
  | ShareableCodeBlock
  | ShareableMakeBlock
  | ShareableExcelBlock
  | ShareableInstagramBlock
  | ShareableSearchBlock;

interface ShareableAgent {
  id: string;
  name: string;
  description: string;
  agentDescription: string;
  tags: string[];
  blocks: ShareableBlock[];
}

// Add export to the constant declaration
export const SHAREABLE_AGENTS: ShareableAgent[] = [
  {
    id: "thought-leadership",
    name: "Thought Leadership Blog Post",
    description:
      "Generate a thought leadership blog post by analyzing research and event data",
    agentDescription:
      "Benefit Metrics: saves ~2 hours per blog post (<a href='https://blog.hubspot.com/marketing/blogging-time-benchmark' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>)",
    tags: ["Content", "Marketing"],
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@abstract.pdf following represents a research document. Please summarize all the key points and specific datapoints, into a few concise bullet points.",
        attachedFile: {
          name: "abstract.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1Ti5qK9pKUQlZold4ViCEoAdwR83GeD_Z/view?usp=sharing",
          content:
            "Research on AI in the workplace shows significant improvements in productivity and job satisfaction. Key findings include 78% of respondents reporting increased efficiency and 65% noting improved focus on high-value tasks.",
        },
        outputVariable: {
          name: "research_summary",
        },
        output: `Model Response:

- Artificial intelligence (Al) is leading to major changes in the modern workplace.
- Companies are using Al tools to enhance productivity, automate routine tasks, and drive innovation.
- The research in the document examines the sentiment of over 2,000 professionals across various industries towards Al adoption.
- 78% of respondents found Al as a useful tool in their daily work, stating that it increases efficiency, reduces manual workload, and improves decision-making.
- 65% of surveyed professionals believe that Al enables them to focus on high-value tasks, thereby improving job satisfaction.
- The study concludes that there's a positive correlation between Al adoption and both workplace efficiency and employee satisfaction, underscoring the benefits of responsible Al integration in professional`,
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "The following is a spreadsheet of a survey we took after hosting a training workshop. Please analyse it and give me the following metrics: 1) what% of people came 2) the average satisfaction level, and any other data you think is interesting. Summarize it into a few concise bullet",
        attachedFile: {
          name: "workshop_attendance.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1mxvrxfNDFxMDc5Yg0uyg7NELhpRYRGhU/view?usp=sharing",
          content:
            "Attendance: 34/50 (68%)\nSatisfaction Scores:\n- 5: 6 attendees\n- 4: 18 attendees\n- 3: 5 attendees\nAverage: 4.0/5.0",
        },
        outputVariable: {
          name: "event_summary",
        },
        output: `1) Out of 50 attendees, 34 confirmed attendance at the training workshop, indicating that 68% of invitees attended.
2) The average satisfaction score of attendees is approximately 4 (Compute by: (5*6)+(4*18)+(3*5)j/34 = 4), based on a 5 point scale where 5 represents highly satisfied.
Additional interesting data:
- No one marked the lowest comfort score (1), indicating that attendees generally had a positive experience.
- The majority of attendees rated the event with a score of 4, showing a high level of satisfaction.
- The amount of attendees marking the highest score (5) was more than those marking the middle score (3), suggesting that a significant portion of the attendees were highly satisfied with the training.`,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "Using this example blog post as a reference, please use the data in ({event_summary}} and ({research_summary}} to write a draft blog post. Make it thoughtful but concise. The goal is to be a thought leader in the space.",
        attachedFile: {
          name: "example_blog_post.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1q_6oaHnNNT1hBSRXqVUjhU3Hov8CGz0G/view?usp=sharing",
          content:
            "Example blog post structure:\n\n1. Introduction\n2. Key Findings\n3. Data Analysis\n4. Implications\n5. Conclusion",
        },
        outputVariable: {
          name: "blog_post_draft",
        },
        output: `An enlightening recent study demonstrated the profound impact of Artificial Intelligence (Al) on various aspects of our professional life. Al is not just a distant concept of the future anymore; it's here and it's now, flourishing across multiple industries.

The study, which gathered feedback from over 2,000 professionals, highlighted the overwhelmingly positive sentiment towards Al integration within workplaces. A staggering 78% of participants viewed Al as a valuable tool for their daily tasks. They attributed enhanced efficiency, reduced manual workload and improved decision-making to Al's ability to automate routine tasks.

Most notably, 65% of surveyed professionals expressed that Al empowers them to focus more on high-value tasks, thereby enhancing their job satisfaction. This interesting correlation between Al adoption and job satisfaction reflects the potential Al holds to revolutionize the modern professional landscape by fostering a more gratifying work environment.

This finding ties nicely into a recent training workshop where we experienced a similar positive reaction. Out of 50 attendees, 34 - an impressive 68% - confirmed their attendance. The attendees' satisfaction was on average 4 out of 5, reflecting a positive reception towards the training. It's worth noting that the majority of attendees ranked the event with a 4, with a significant portion marking the highest possible score of 5, a testament to the level of satisfaction experienced by attendees.

Stepping back from the numbers, it was fascinating to observe that no attendee marked the lowest comfort score - a clear signal that the use of Al in the workshop resulted in a positive experience for all involved.

The data from both the workshop and the wider study underline a singular message - Al, when used responsibly, brings about considerable advantages to the workplace. It enhances productivity, automates tasks, and most importantly - drives the satisfaction of professionals.

The value of Al is unquestionable. It is the ultimate tool that will help us re-shape the future of work and transform the professional world into a highly efficient, productive and satisfying environment. Al is here and it's time we maximize its potential to drive positive change.`,
      },
      {
        id: "block4",
        type: "contact",
        blockNumber: 4,
        to: "your_email@company.com",
        subject: "Blog Post Draft",
        body: "{{blog_post_draft}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "lead-qualifier",
    name: "Lead Qualifier",
    tags: ["Sales"],
    description:
      "Qualify leads efficiently with automated analysis and scoring",
    agentDescription:
      "Benefit Metrics: Turns lead qualification from hours to seconds, letting you qualify and contact inbound leads in seconds. Contact leads within 5 minutes can increase conversion rates by 21x (<a href='https://forecastio.ai/blog/sales-pipeline-metrics' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>)",
    //   "Benefit Metrics: Turns lead qualification from hours to seconds, letting you qualify and contact inbound leads in seconds. Contact leads within 5 minutes can increase conversion rates by 21x. (source)",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "Analyse the following document - and extract key instructions related to:\n1. how a lead should be qualified\n2. what data or content we should gather for each lead (i.e. social media metrics, landing page copy etc...)\n3. the output of each lead qualification\nProduce a concise summary",
        attachedFile: {
          name: "lead_qualification_guide.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1zOaW3OKihzAgOgnZcL8A3w6COqS4SX7O/view?usp=sharing",
          content:
            "Lead qualification guidelines for sustainable clothing brand partnerships...",
        },
        outputVariable: {
          name: "lead_qualification_poc",
        },
        output: `The document provides guidelines for qualifying leads for sustainable clothing brand partnerships. The qualification process involves the following steps:
1. Verify Sustainability Credentials: Check the brand's official website, third-party certifications, and social media to confirm their sustainability status. Look for terms like 'sustainability", 'the environment", or 'impact'. Look for usage of sustainable materials.
2. Evaluate Order Volume: Ensure the brand has sufficient order volume using their Instagram following as a proxy. Check engagement metrics and stock availability.
3. Assess Product Assortment: Ensure the brand offers a diverse product range by reviewing their website's product categories and the demographics they serve.
4. Make a Final Lead Qualification Decision: Based on all three criteria, classify the lead as either 'Yes, Proceed', 'Proceed, but investigate further', or 'No, Do Not Proceed'.
Data to gather for each lead includes:
- Sustainability claims, certifications, and material usage from their website and social media.
- Instagram following, engagement metrics, stock availability, and customer reviews.
- Product categories, demographic targets, and variety in their catalog.
The output of each lead qualification is a decision:
- 'Yes, Proceed' if the lead meets all three criteria.
- 'Proceed, but investigate further' if the lead meets some criteria but needs deeper evaluation.
- 'No, Do Not Proceed" with a reason, if the lead fails to meet key criteria.
Best practices include taking screenshots of sustainability claims, using social media analytics tools, keeping disqualification notes, and reporting findings ithe CRM under the lead's profile.`,
      },
      {
        id: "block2",
        type: "webagent",
        blockNumber: 2,
        url: "tentree.com",
        nickname: "@tentree",
        outputVariable: {
          name: "website_summary",
        },
        output: "Website processed!",
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "@tentree is a brands website. Please extract all information required to qualify the lead, based on {(lead_qualification_poc)}.",
        attachedFile: {
          name: "tentree",
          type: "website",
          url: "https://tentree.com",
          content: "Tentree website content...",
        },
        outputVariable: {
          name: "website_summary",
        },
        output: `Based on the provided context, here is the information available related to qualifying @tentree as a sustainable clothing brand lead:
1. **Verify Sustainability Credentials:**
- **Sustainability Claims and Material Usage:** @tentree focuses on sustainability by committing to planting one billion trees by 2030 to help protect our planet. They state that each item purchased results in trees being planted, emphasizing that their business model supports environmental sustainability. The website mentions the use of sustainable practices to divert waste from landfills, conserve water, and other resources. However, specific certifications or the types of sustainable materials used are not detailed in the provided text.
2. **Evaluate Order Volume:**
- **Instagram Following and Engagement Metrics:** The provided text does not include details about @tentree's Instagram following or engagement metrics. Information about stock availability or customer reviews is also not
3. **Assess Product Assortment:**
- **Product Categories and Demographic Targets:** @tentree offers various product categories such as Best Sellers, Men's and Women's collections, including specific items like T-shirts & Tanks, Hoodies & Sweatshirts, and Joggers, Pants & Leggings. This indicates a diverse product range catering to different demographics.
Given this preliminary information, the final lead qualification decision would be **"Proceed, but investigate further."**
- **Reasons for Decision:**
- The sustainability credentials are stated but require verification through additional details on specific certifications and sustainable`,
      },
      {
        id: "block4",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "@tentree_ig is a brands social media page. Please extract all information required for {lead_qualification_poc} in a concise summary",
        attachedFile: {
          name: "tentree_ig.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1qPeLB0XuClh5jkKuKn41UNuHaEjV1km2/view?usp=sharing",
          content: "Social media metrics and engagement data for tentree...",
        },
        outputVariable: {
          name: "ig_summary",
        },
        output: `Based on the limited information available from the single source:
1. Sustainability Credentials: tentree is described as an "Earth-First apparel" brand that makes products sustainably for people and the planet. Additionally, every item they sell involves the planting of trees, further aligning with the idea of sustainability.
2. Order Volume: The Instagram page for tentree has 2 million followers, indicating a substantial potential audience and order volume. Specific engagement metrics and stock availability aren't available in the given source.
3. Product Assortment: Specific product categories or the variety in their catalog cannot be determined from the provided source.
In conclusion, we can classify tentree as 'Proceed, but investigate further' because it meets some of the key criteria (sustainability claim and high Instagram following) for becoming a sustainable clothing brand partner, but more information is needed regarding their product assortment, specific engagement metrics, and stock availability.`,
      },
      {
        id: "block5",
        type: "agent",
        blockNumber: 5,
        userPrompt:
          "Using @lead_qualification as a reference, please analyse ({website_summary)} and {{ig_summary)}, and qualify this lead please.",
        attachedFile: {
          name: "lead_qualification.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1zOaW3OKihzAgOgnZcL8A3w6COqS4SX7O/view?usp=sharing",
          content: "Lead qualification guidelines...",
        },
        outputVariable: {
          name: "qualification_summary",
        },
        output: `Lead Qualification Summary for @tentree

Final Decision: Proceed, but investigate further

Analysis by Criteria:

1. Sustainability Credentials (Partially Met)
- Strong sustainability messaging and commitment to environmental impact
- Tree planting initiative demonstrates environmental consciousness
- Missing: Specific certifications and sustainable material details

2. Order Volume (Strong)
- 2M Instagram followers indicates strong market presence
- Missing: Specific engagement metrics and stock availability data

3. Product Assortment (Partially Met)
- Diverse product categories (T-shirts, Hoodies, Pants, etc.)
- Clear demographic targeting (Men's and Women's collections)
- Missing: Complete catalog variety assessment

Recommendations:
1. Request detailed sustainability certifications and material information
2. Gather specific Instagram engagement metrics
3. Complete product assortment analysis
4. Schedule follow-up call to address missing information

Next Steps:
1. Schedule technical deep dive to validate sustainability claims
2. Request access to social media analytics
3. Conduct full product catalog review
4. Prepare detailed proposal for qualified leads`,
      },
      {
        id: "block6",
        type: "contact",
        blockNumber: 6,
        to: "youremail@company.co",
        subject: "New Lead Qualification Report",
        body: "{{qualification_summary}}",
        output: "✉️ Lead qualification report sent!",
      },
    ],
  },
  {
    id: "2",
    name: "Personalized Cold Email Generator",
    tags: ["Sales", "Marketing"],
    description: "Generate personalized cold emails that convert",
    agentDescription:
      "Benefit Metrics: ~30x increase in personalized emails written per hour (~ on average 60 vs 2 emails per hour). Additionally, this agent frees up your sales reps to focus on higher leverage, more complex tasks.",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@cold_email_guide represents how a sales rep should analyse a website and create a personalized cold email for our services. Extract all the key points and instructions, that an agent can use when they look at a website.",
        attachedFile: {
          name: "cold_email_guide.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1SD4S3QT6tBmfx6C-3W1K2kDqrOt1SdOv/view?usp=sharing ",
          content: "Cold email guide content...",
        },
        outputVariable: {
          name: "email_instructions",
        },
        output: `When analyzing a clothing brand's website for cold email personalization, the sales rep should focus on identifying key details relevant to the services our company provides, particularly focusing on signs that indicate a fit for our distribution and logistics services. Here are the key points to consider:

1. Type of clothing the brand sells - casual, activewear, luxury, streetwear or any other specific category.

2. Identifying their target customer - men, women, kids, or niche audiences like eco-conscious consumers, Gen Z, plus-size etc.

3. Asses the scale of the brand's operation - multiple collections, frequent product drops, press features etc.

4. Check if the brand is sustainable or environmentally focused - look for keywords like "sustainable", "ethical", "carbon neutral",
"organic cotton", "closed-loop production" or certifications like GOTS or Fair Trade.

5. Identify their geographical presence and shipping scope - local, national, or international
6. Assess how shipping and fulfillment is presented - 1-2 day delivery promises, eco-friendly packaging, any mention of shipping as a customer pain point.
7. Understand the brand's story or mission - can include a quote, origin story, or founder's mission in the email.
8. Look for any mention of logistics or third-party partners - signs they might be managing fulfillment in-house or struggling with scale.
9. Review recent blog posts, press mentions, or campaigns - useful for timely relevance in the email e.g., mentioning their recent collaboration with another brand or company.
10. Check if they highlight customer experience or community - indicates they care about post-purchase experience, which aligns with our services.
Remember, personalizing is more than using a name - it involves showing the brand that you understand their business, and making clear connections between their goals and what we offer in logistics and distribution`,
      },
      {
        id: "block2",
        type: "webagent",
        blockNumber: 2,
        url: "tentree.com",
        nickname: "@tentree",
        outputVariable: {
          name: "website_data",
        },
        output: "Website processed!",
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "@tentree is a prospective customers website. Please use {{email_instructions}} as a guide, and create a v1 cold email using this",
        attachedFile: {
          name: "tentree",
          type: "website",
          url: "https://tentree.com",
          content: "Tentree website content...",
        },
        outputVariable: {
          name: "draft",
        },
        output: `Subject: Enhance Your Sustainable Mission with Tailored Distribution Solutions

Hi [Recipient's Name],

I've been thoroughly impressed by the vibrant and sustainable ethos that ten tree® embodies in the fashion industry. Your commitment to eco-conscious clothing is not just seen but felt through your wide range of collections that cater elegantly to both casual and activewear enthusiasts.

Your focus on sustainable clothing, featuring organic materials, and initiatives for tree planting resonate deeply with a growing segment of environmentally-aware consumers, from young adults to eco-conscious families. It's evident that ten tree® is not just a clothing brand, but a movement geared towards a greener planet.

While exploring your website, I noticed the breadth of your offerings in men's and women's activewear, as well as essential accessories, reflecting a robust operation with international reach. Your campaigns, like the interactive virtual forest island that grows with customer engagement, are truly innovative, enhancing the customer experience and fostering a community around sustainability.

However, as brands like yours expand, managing logistics efficiently becomes critical, especially when committed to sustainable practices. Our logistics and distribution solutions are tailored specifically for eco-friendly brands like yours. We prioritize minimizing carbon footprints, using recyclable materials, and securing cost-effective, comprehensive distribution options that resonate with your mission and operational scale.

By incorporating our solutions, TenTree could amplify its impact by ensuring each product not only contributes to global reforestation but also reaches your customers through the greenest routes possible. Our expertise in handling diverse product lines with care and sustainability at the forefront ensures that your operations remain as thoughtful as your brand values.

I'd love to schedule a quick call to explore how we can support TenTree's growth while staying true to your environmental mission. Let me know if there's a time that works for you next week—I'll make it work on my end. Looking forward to connecting!

Best,
Sahil`,
      },
      {
        id: "block4",
        type: "contact",
        blockNumber: 4,
        to: "yourname@company.co",
        subject: "New cold email draft",
        body: "{{draft}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "3",
    name: "Custom Ads Campaign Generator",
    tags: ["Marketing"],
    description: "Create targeted ad campaigns across multiple platforms",
    agentDescription:
      "Benefit Metrics: saves ~3 hours per personalized campaign. The agent creates a first draft of a Google ads campaign, which you can edit as needed and upload directly into Google Ads.",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@ads_guide is a guide for how to read a website and pull out content for an ads campaign. Please summarize the key points into a few concise bullet points.",
        attachedFile: {
          name: "ads_guide.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1PU_cmgPHj_qNSyz5hzQ6qiiA7DriNQZ9/view?usp=sharing",
          content: "Ads guide content...",
        },
        outputVariable: {
          name: "ads_guide",
        },
        output: `- Conduct an initial review of the client's website to understand their business offerings, target audience, primary calls-to-action, messaging, and trust signals.
- Identify key pages like homepage, landing pages, blogs, and contact forms. Check if they are optimized and check for SEO opportunities.
- Analyze the website to answer questions about main products or services, promotions, location, differentiation factor, keywords, and conversion tracking.
- Build a Google Ads campaign with a specific goal, structured on keyword research and well-defined ad groups. Create 3-5 ad variants per ad group, add extensions, and align location & demographics with target audience.
- Utilize bidding strategies like Maximize Conversions or Target CPA and align ad messaging with website's landing page content for higher Quality Scores and conversion rates.`,
      },
      {
        id: "block2",
        type: "webagent",
        blockNumber: 2,
        url: "tentree.com",
        nickname: "tentree",
        outputVariable: {
          name: "website_data",
        },
        output: "Website processed!",
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "analyse @tentree and pull out content as per {{ads_guide}}",
        attachedFile: {
          name: "tentree",
          type: "website",
          url: "https://tentree.com",
          content: "Tentree website content...",
        },
        outputVariable: {
          name: "website_content",
        },
        output: `1. **Initial Website Review**：
- **Business Offerings**: The business sells sustainable clothing and plants trees for every item purchased.
- **Target Audience**: Environmentally conscious consumers interested in sustainable, organic clothing.
- **Primary Calls-to-Action**:
- "Get your own interactive virtual forest"
- "Get rewarded for doing good"
- "Tree Planting on Autopilot"
- Product purchase links
- **Messaging**: Focus on sustainability, organic products, and making a positive impact on the planet by planting trees.
- **Trust Signals**: The site emphasizes the total number of trees planted, aiming for 1 billion trees by 2030, and positions itself transparently about sustainability efforts. 

2. **Key Pages & SEO Opportunities**:
- **Homepage**: Likely contains links to collections and offers/promotions. Check if SEO elements like meta tags, descriptions, and keyword-rich content are present.
- **Landing Pages**: Pages linked in the text for products like hemp dresses and knit tank dresses.
Check for targeted SEO content and alignment with relevant keywords.
- **Blogs**: No direct links or mentions of blogs were found, suggesting an opportunity to bolster content marketing efforts.
- **Contact Forms**: Not explicitly mentioned; consider adding to increase engagement.`,
      },
      {
        id: "block4",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "{{website_content)} shows an analysis of a prospective clients website for a digital ads campaign. Use this information to produce an draft of a google ads campaign. This will be saved as a spreadsheet that i can upload directly into google ads. Make sure each header be it's own column.",
        outputVariable: {
          name: "v1_campaign",
        },
        output:
          "Campaign created and downloaded! You can view and download the campaign here: https://drive.google.com/file/d/1Hiq0CpU-kJUoXd6Ac3rhLG-qKG3Ksqr8/view?usp=sharing",
      },
    ],
  },
  {
    id: "4",
    name: "Project Updater",
    tags: ["Project Management", "Admin"],
    description: "Keep stakeholders informed with automated project updates",
    agentDescription:
      "Benefit Metrics: saves ~1 hour per project update. The agent can also be extended to adding necessary tickets and sending follow-ups. Free your project manager up to fight important fires!",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "These are last weeks meeting notes. Please give me a summary of what was discussed and what the action items are. Also record the formatting.",
        attachedFile: {
          name: "last_weeks_notes.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1KkgCzWeGtR75kLwczBhPehq1yDaBy6xL/view?usp=sharing",
          content: "Meeting notes content...",
        },
        outputVariable: {
          name: "last_weeks_notes",
        },
        output: `During the meeting on March 17, 2025, the project: Platform Migration for Email Tool was kicked off with an initial scoping session. There was a discussion on the need to move from the current email delivery provider to a platform that is more scalable, reliable, and cost-effective. The broad goals of this migration were reviewed and the key stakeholders were identified.

As for the action items, these involve the collection of requirements from several teams. The three main action items defined during the meeting are:
1. Gather requirements from the Product team
2. Gather requirements from the Engineering team
3. Gather requirements from the Marketing team

The notes are formatted with the date and Project name at the beginning, followed by a summary of the discussions. The final sections list the action items with an indication (I) to mark completion.`,
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "you're a projet manager for a platform migration. These files represent bits of work that your stakeholders have sent you.Your team has sent you a file -@product_team_requirements.pdf. Please summarize what the file is, as well as the contents of the document.",
        attachedFile: {
          name: "product_team_requirements.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/13yUcJRp7yxpgOwJJukPJ5hrhrsvyOPk_/view?usp=sharing",
          content: "Product team requirements...",
        },
        outputVariable: {
          name: "file_summary_1",
        },
        output: `The file, @product_team_requirements.pdf, appears to be a document outlining certain requirements for a platform migration project. 

It specifies five key elements that are necessary for the project:

1. Reliable Delivery: The platform must ensure a deliverability rate of 99% or higher, ensuring reliability and efficiency.
2. A/B Testing: The new platform needs to support the capability for product managers to run tests on different email variations to find the most effective one.
3. Segmentation: The platform must be able to integrate with user segments and cohorts from the product database, allowing for targeted marketing efforts.
4. Analytics: It is necessary for the platform to provide real-time analytics on email open, click, and bounce data, with dashboards included for easy overview and tracking.
5. Scheduling: There must be support for scheduling emails based on user behavior and time zones, providing more customization in communication.

Thus, the document essentially describes these technical and functional specifications that the platform should meet for the migration to be successful`,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "Your team has sent you a file -@engineering_team_requirements.pdf. Please summarize what the file is, as well as the contents of the document.",
        attachedFile: {
          name: "engineering_team_requirements.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1AcEI-KIAUabcKPnenVb6isHxr7jYA9FZ/view?usp=sharing",
          content: "Engineering team requirements...",
        },
        outputVariable: {
          name: "file_2_summary",
        },
        output: `The file named "@engineering_team_requirements.pdf" from the engineering team details certain requirements that are crucial for a platform migration process they are planning.

Here are the key points mentioned in the document:
1. API access: The requirement for robust APls which can take care of sending, tracking, and managing emails.
2. Scalability: The platform must have the ability to support the sending of millions of emails per day.
3. Support for webhooks: It must be able to provide real-time event data for opens, clicks, bounces, and unsubscribes.
4. Infrastructural compatibility: The platform should be compatible with the team's pre-existing AWS and Firebase stack.
5. Security and Compliance: The requirement for the platform itself to be SOC 2 compliant, with an ability to support TLS encryption along with GDPR`,
      },
      {
        id: "block4",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "This file represents notes we took for this weeks project update meeting. Please create a new project summary based on these notes, and the work done in {{file_summary_1}}. {{file_2_summary}} and last weeks notes (last_week_summary)). Use the formatting in {last_week_summary)) , with a high level summary at the top and action items below. Use @last_weeks_notes and {{file_summary_1}} and {{file_summary_2)} for what was done this week. Under Action Items, include action items from last week that were not done, as well as new action items from this week.",
        attachedFile: {
          name: "this_weeks_meeting.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1LhaVPAIlAnZCMA944NjhrTjuZY654mma/view?usp=sharing",
          content: "This week's meeting notes...",
        },
        outputVariable: {
          name: "summary_draft",
        },
        output: `Project Update: Platform Migration for Email Tool
Date: March 24, 2025

Summary:
This week marked significant progress in our platform migration project. We successfully gathered requirements from both the Product and Engineering teams, providing clear technical and functional specifications for the new email platform. The Product team emphasized the need for reliable delivery (99%+), A/B testing capabilities, user segmentation, real-time analytics, and advanced scheduling features. The Engineering team outlined technical requirements including robust APIs, scalability for millions of emails, webhook support, AWS/Firebase compatibility, and security compliance (SOC 2, GDPR).

Action Items:
From Last Week (Completed):
(✓) Gather requirements from the Product team
(✓) Gather requirements from the Engineering team
(I) Gather requirements from the Marketing team

New Action Items:
1. Research potential platforms that meet both Product and Engineering requirements
2. Schedule technical deep-dive sessions with top 3 platform candidates
3. Create comparison matrix of platform features vs. requirements
4. Complete pending Marketing team requirements gathering
5. Draft initial migration timeline and resource allocation plan`,
      },
      {
        id: "block5",
        type: "contact",
        blockNumber: 5,
        to: "youremail@company.co",
        subject: "This weeks project update",
        body: "{{summary_draft}}",
        output: "✉️ Project update sent!",
      },
    ],
  },
  {
    id: "5",
    name: "Sales Follow Up Email",
    tags: ["Sales", "Admin"],
    description: "Generate timely and personalized follow-up emails",
    agentDescription:
      "Benefit Metrics: Conversion rates increase by as much as 7x (<a href='https://growthlist.co/sales-follow-up-statistics/' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>) by sending a follow up within an hour. Personlized emails see 2.7x higher conversion rates, and 5.7x more revenue (<a href='https://www.conversica.com/blog/inbound-lead-follow-up-stats-for-2023/' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>).",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "analyse @product_pricing_table, and record how much each product line is for each subscription amount",
        attachedFile: {
          name: "product_pricing_table.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1v3enOQuoLUDekXHBnS_mF-HpthxoZoYN/view?usp=sharing",
          content: "Product pricing data...",
        },
        outputVariable: {
          name: "pricing_table",
        },
        output: `The pricing for each product line for each subscription period according to the source is as follows:
Inventory Intelligence Suite:
- 3-Month Price (per mo): $1800
- 6-Month Price (per mo): $1650
- 12-Month Price (per mo): $1500
Order Management Pro:
- 3-Month Price (per mo): $1400
- 6-Month Price (per mo): $1250
- 12-Month Price (per mo): $1100
Returns Automation Engine:
- 3-Month Price (per mo): $1300
- 6-Month Price (per mo): $1200
- 12-Month Price (per mo): $1000
Fulfillment API Toolkit:
- 3-Month Price (per mo): $1200
- 6-Month Price (per mo): $1100
- 12-Month Price (per mo): $1000
Sustainability Analytics Dashboard:
- 3-Month Price (per mo): $1000
- 6-Month Price (per mo): $950
- 12-Month Price (per mo): $900`,
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "You are a revops agent, helping a sales rep with all the administrative tasks required to complete a sale. Using {pricing_table}} as a reference, analyse @sales_meeting_notes and give me a summary for what the user has signed up for and how much it will be.",
        attachedFile: {
          name: "sales_meeting_notes.pdf",
          type: "pdf",
          url: "https://docs.google.com/document/d/1qKRVfVkprnZykeCv0SdL8CM91n7rD8kJf0SVfbaXoBM/edit?usp=sharing",
          content: "Sales meeting notes...",
        },
        outputVariable: {
          name: "sales_summary",
        },
        output: `According to the source provided, the user, StyleWear Inc., has signed up for a 12-month subscription to the Inventory Intelligence Suite. The cost for a 12-month subscription to this suite is $1500 per month. Therefore, the total cost for the 12-month period will
be $1500 * 12 = $18,000.`,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "{{sales_summary}} is the summary of a sales call a sales rep had. You are a revops agent, helping the sales rep with all the administrative tasks required to complete a sale. Using {pricing_table}} as a reference, and create a follow up email similar to @sample_email",
        attachedFile: {
          name: "sample_email.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1YIzGlI31PjUG8yTu7Q73s1V8KSyRfCQz/view?usp=sharing",
          content: "Sample email template...",
        },
        outputVariable: {
          name: "email_draft",
        },
        output: `Dear [User's Name],
It was wonderful speaking with you earlier! As per our conversation, I am sending over the contract details for the Sustainability Analytics Dashboard that we discussed.
Product: Sustainability Analytics Dashboard
Contract Length: 3 months
Monthly Cost: $1,000
Total Contract Value: $3,000
Start Date: April 1, 2025
End Date: June 30, 2025
Billing: Monthly, via ACH or credit card
Now, here are the next steps required to finalize your agreement:
1. Complete the DocuSign agreement (I will send the link separately).
2. Once signed, we will send over the onboarding documentation and schedule your kickoff call.
3. During the call, we will walk through the initial setup, data integrations, and the custom KPls that you would like to track.

Looking forward to getting you all setup and ready to go. Please feel free to reach out if you have any questions in the meantime.
Best Regards,
[Your Name]
[Your Position]
[Your Email]`,
      },
      {
        id: "block4",
        type: "contact",
        blockNumber: 4,
        to: "name@yourco.com",
        subject: "Sales Call Follow Up",
        body: "{{email_draft}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "6",
    name: "Company Analyser",
    tags: ["Finance", "Data Analysis"],
    description: "Deep dive into company financials and metrics",
    agentDescription:
      "Benefit Metrics: reduces time to analyse all documents from ~3-4 hours (<a href='https://www.reddit.com/r/Accounting/comments/taxhv2/how_long_does_it_take_you_to_do_analysis_on/' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>) to minutes. This agent takes over the tedious tasks, freeing your analysis up for more qualitative and complex tasks. ",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@financial_analysis_guide This file represents how to analyse a companies documents and web presence, to see if they are a good fit for our financial consulting company. Please extract the key points, including what questions need to be asked, and what datapoints we should look for in each document.",
        attachedFile: {
          name: "financial_analysis_guide.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1TMsoOQlIQr_QL6dvTKRVqhE7DBE9jjfZ/view?usp=sharing",
          content: "Financial analysis guide content...",
        },
        outputVariable: {
          name: "analysis_guide",
        },
        output: `Sure, here are the fundamental steps and points to be considered while evaluating a company for Private Equity Partnership according to the given guide:
Step 1: Website Analysis. Questions to answer:
- What does the company do? (Industry, products/services, business model)
- Who are their customers? (B2B/B2C, enterprise vs. SMB)
- Does the company highlight growth, expansion, or new products?
- Are there signs of operational scale? (Multiple locations, global presence, large team)
- Are there leadership bios and investor relations sections for insight into maturity and funding?
Step 2: Analyze the 10-K Summary:
- Business Overview: What are the company's core segments and how are they performing?
- Competitive Position: Are they a market leader or challenger?
- Risk Factors: Identify any red flags (regulatory, operational, customer concentration)
- MD&A (Management Discussion and Analysis): What are management's stated growth plans?
- Revenue and Profit Trends: Look at Year over Year (YoY) changes and margins
Key Metrics to Watch in the 10-K Summary:
- EBITDA margin
- Revenue growth
- Net income trends
- R&D or CapEx intensity (depending on sector)
Step 3: Cash Flow Statement Analysis
- Operating Cash Flow: Is the company consistently generating cash from operations?
- Investing Cash Flow: Are they investing in growth (e.g., acquisitions, CapEx)?
- Financing Cash Flow: Look at debt activity—are they taking on or paying down debt?
- Free Cash Flow: Evaluate how much cash is available after CapEx
Indicators of PE Readiness:
- Strong EBITDA with room for margin improvement
- Proven product/market fit with growth potential
- Predictable cash flow and low customer churn
- Management team open to strategic partnerships or exits
- Opportunity for value creation through operational improvements or beit-on acquisitions
Pro Tip: Look for companies with solid fundamentals but clear areas for optimization. PE firms thrive on unlocking value.`,
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "Use {{analysis_guide}} as a reference and analyse this file. extract all the key points into a concise summary.",
        attachedFile: {
          name: "DoorDash_Balance_Sheet.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1SWvBJxN7VQy-JPly6vAmxQ0blXUhFFto/view?usp=sharing",
          content: "DoorDash balance sheet data...",
        },
        outputVariable: {
          name: "doc_1_summary",
        },
        output: `The document provided is the Consolidated Balance Sheets of DoorDash, Inc for the years ending December 31, 2023 and December 31, 2024. Below are the key points:
- The total assets increased from $10,839 million in 2023 to $12,845 million in 2024, with an increase in cash and cash equivalents, restricted cash, accounts receivable, prepaid expenses and other current assets.
- In terms of long-term assets, there was an increase in long-term marketable securities and property and equipment. However, the operating lease right-of-use assets and goodwill decreased.
- Current liabilities increased from $3,410 million in 2023 to $4,438 million in 2024 with the largest contribution being from accrued expenses and other current liabilities.
- Total liabilities increased from $4,026 million in 2023 to $5,035 million in 2024.
- The redeemable non-controlling interests remained stable at $7 million.
- Regarding Stockholders' Equity, there's an increase in additional paid-in capital but a decrease in accumulated other comprehensive income (loss). The accumulated deficit also increased
- However, total stockholders' equity increased from $6,806 million in 2023 to $7,803 million in 2024.
- The total liabilities, redeemable non-controlling interests, and stockholders equity matched the total assets for both years.
This indicates good financial health and potential for further growth. But for a comprehensive understanding, further analysis of income statement, cash flow statement, and other factors would be of benefit.`,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "Use {{analysis_guide]} as a reference and analyse this file. extract all the key points into a concise summary.",
        attachedFile: {
          name: "DoorDash Statement of Operations.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1l2lc7V2l9V4hXpCmxQwC1KMX5PSTt0Zk/view?usp=sharing",
          content: "DoorDash operations data...",
        },
        outputVariable: {
          name: "file_2_summary",
        },
        output: `From the DoorDash, Inc. consolidated statement of operations, here is the brief summary:
DoorDash made a revenue of $2,303 million in 2023 Q4 which increased to $2,873 million in 2024 Q4. The annual revenue also grew from $8,635 million in 2023 to $10,722 million in 2024.
Their total costs and expenses in 2024 were $2,756 million for Q4 and $10,760 million for the full year. This is an increase from $2,392 million (Q4) and $9,214 million (full year) in 2023.
In terms of net income attributable to DoorDash, it changed from a loss of $154 million in Q4 2023 to a gain of $141 million in Q4
2024.
For the full years of 2023 and 2024, DoorDash had net losses of $558 million and $123 million respectively.
In terms of earnings per share for DoorDash common stockholders, the company went from a loss per share of $0.39 in 2023 (for both basic and diluted) to a profit per share of $0.34 (basic) and $0.33 (diluted) in 2024 Q4.
For the full year, the loss per share was $1.42 in 2023 and the profit per share was $0.30 (basic) and $0.29 (diluted) in 2024.
In terms of share numbers, the average number of shares used to calculate income per share increased from 399,336 (basic and diluted) in Q4 2023 to 417,056 (basic) and 433,039 (diluted) in Q4 2024.
For the full year, the number increased from 392,948 (basic and diluted) in 2023 to 411,551 (basic) and 430,242 (diluted) in 2024.`,
      },
      {
        id: "block4",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "{{doc_1_summary)} and {{doc_2_summary)) all represent summaries of key financial documents for a company we are analysing. Please summarise everything as per @financial_analysis_guide, and give me a concise summary of the analysis.",
        attachedFile: {
          name: "financial_analysis_guide.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1TMsoOQlIQr_QL6dvTKRVqhE7DBE9jjfZ/view?usp=sharing",
          content: "Financial analysis guide content...",
        },
        outputVariable: {
          name: "summary_draft",
        },
        output: `Based on the provided financial information and applying the steps of the Financial Analyst Guide, here is a brief financial analysis of DoorDash, Inc:
10-K Summary Analysis:
- Business Overview: DoorDash, Inc. is growing its revenue YoY, which is positive sign. Revenue increased from $8,635 million in 2023 to $10,722 million in 2024. Their total assets also increased from $10,839 million in 2023 to $12,845 million in 2024.
- Competitive Position: Information about its market position in comparison to its competitors is not provided in the data set.
- Risk Factors: The net income showing losses for consecutive years (2013,2014) may be considered a red flag.
- Revenue and Profit Trends: Revenue is growing YoY. From a profit perspective, the company turned from a net loss of $154 million in Q4 2023 to a net gain of $141 million in Q4 2024 which shows margin improvement.
Indicators of PE Readiness:
- Strong EBITDA with room for margin improvement: Data on EBITDA is not provided, but there is notable improvement in net income margin.
- Proven product/market fit with growth potential: Revenue has been consistently growing which indicates a good product-market fit.
- Predictable cash flow and low customer churn: Cannot be evaluated with the provided data.
- Management team open to strategic partnerships or exits: Cannot be evaluated with the provided data.
- Opportunity for value creation through operational improvements or bolt-on acquisitions: DoorsDash's increased revenue, improved net income margins, and growth in total assets suggests potential for value creation.
In conclusion, strong growth in revenues and net income alongside increased total assets shows that DoorDash, Inc. may be a good candidate for PE firms, although more comprehensive data including company website insights, complete 10K summary including market position, risk factors, and management growth plans, as well as cash flow statement would provide a more complete evaluation.`,
      },
      {
        id: "block5",
        type: "contact",
        blockNumber: 5,
        to: "name@yourco.com",
        subject: "financial analysis",
        body: "{{summary_draft}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "7",
    name: "Campaign Analyst",
    tags: ["Marketing", "Data Analysis"],
    description: "Analyze and optimize marketing campaign performance",
    agentDescription:
      "Benefit Metrics: save hours per campaign analysis, by handing the basics off to this agent. This agent reduces the reliance of your marketing managers on data analysis, freeing up your analysts to run more interesting analyses and build durable dashboards. ",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@google_ads represents the performance of a google ads campaigns. analyse the performance performance of each campaign, and summarize it into 3 points per campaign.",
        attachedFile: {
          name: "google_ads.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1c1bxJYuHEFvQ0BlRKJnNzlUU8_qOgojU/view?usp=sharing",
          content: "Google Ads campaign data...",
        },
        outputVariable: {
          name: "google_summary",
        },
        output: `1. The Google Search - Shoes campaign had 50,000 impressions and 4,000 clicks, with a Click-through rate (CTR) of 8.0%.
The total cost of the campaign was $1200, which led to 300 conversions (7.5% conversion rate). The cost per conversion was $4.0 and generated a revenue of 5Y2,000, with a Return on Advertising Spend (ROAS) of 10.0.
2. The Google Display - Apparel campe had a larger reach with 70,000 impressions, winning 5,000 clicks, with a slightly lower CTR of 7.14%. The campaign cost $1500 and resulted in 400 conversions (an 8% conversion rate). The cost per conversion was slightly less than the previous campaign at $3.75 and ended up generating $15,000 in revenue. The ROAS remained consistent at 10.0.
3. Finally, the Google Shopping - Accessories campaign had the largest reach of all with 80,000 impressions. It had 6,000 clicks at a rate of 7.5%. The campaign cost was the highest among the three at $1800, but it also resulted in the highest number of conversions (500), with a slightly higher conversion rate of 8.3%. The cost per conversion was the lowest at $3.60, and it generated $18,000 in revenue, again with a ROAS of 10.0.`,
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "@facebook_ads represents the performance of a google ads campaigns. analyse the performance performance of each campaign, and summarize it into 3 points per campaign.",
        attachedFile: {
          name: "facebook_ads.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1xTXNNwjUBNdWJEapJxWnfSKyTggZgW61/view?usp=sharing",
          content: "Facebook Ads campaign data...",
        },
        outputVariable: {
          name: "facebook_summary",
        },
        output: `1. The 'Facebook Feed - Shoes' campaign had a total of 60,000 impressions and 1,000 clicks, resulting in a Click Through Rate (CTR) of 1.67%. The campaign cost was $2,000 and it led to 50 conversions, giving a conversion rate of 5.0%. The cost per conversion was $40.0 and the campaign brought in revenue of $2,500, giving a Return on Ad Spend (ROAS) of 1.25.
2. The 'Instagram Stories - Apparel' campaign had a total of 75,000 impressions and 1,500 clicks, resulting in a CTR of 2.0%.
The campaign cost was $2,500 and it led to 75 conversions, giving a conversion rate of 5.0%. The cost per conversion was $33.3 and the campaign brought in revenue of $3,750, giving a ROAS of 1.5.
3. The 'Facebook Audience Network - Accessories' campaign had a total of 90,000 Impressions and 1,800 clicks, resulting in a CTR of 2.0%. The campaign cost was $3,000 and it led to 90 conversions, giving a conversion rate of 5.0%. The cost per conversion was $33.3 and the campaign brought in revenue of $4,500, giving a ROAS of 1.5.`,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "{(facebook_ads)) and ({google_ads)) describes performances of different campaigns. Use @example_summary as a reference, and create a report. Respond only with the",
        attachedFile: {
          name: "example_summary.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1CKifckK3Mg07e157PyJxy_Ews7ETSynX/view?usp=sharing",
          content: "Example summary format...",
        },
        outputVariable: {
          name: "weekly_summary_draft",
        },
        output: `Campaign Summary Report
In relation to the recent advertising campaigns on Google Ads and Facebook Ads, the Google Ads campaign outperformed with high engagement and a strong return on ad spend (ROAS). In contrast, the Facebook Ads campaign struggled with lower engagement and a significantly lower ROAS, suggesting Inefficlencies in its targeting and conversion strategies.
Google Ads displayed impressive results across key performance metrics. The campaign saw a total of 200,000 Impressions, 15,000 clicks, and a click-through rate of 7.5%. The total ad spend was $4,500, resulting in 1,200 conversions, an 8% conversion rate, and a cost per conversion of $3.75. Total revenue generated was $45,000 with a ROAS of 10x. Its high engagement and conversion rates speak to the efficacy of targeted ads and strong ad creatives.
Conversely, the Facebook Ads campaign underperformed despite its high impressions. It garnered only 4,300 clicks out of 225,000 impressions, indicating a click-through rate of 1.91%. The total ad spend on Facebook was $7,500, with 215 conversions, a conversion rate of 5%, and a cost per conversion of $34.88. The total revenue generated was $10,750, demonstrating a considerably lower ROAS of 1.43x.
Recommendations for moving forward include an increase in the Google Ads budget given its strong performance, a revision of Facebook Ads strategies for better audience engagement, cross-channel optimization by retargeting Facebook Ads users who engaged with Google Ads, and regular performance monitoring.
These steps aim to optimize overall ad performance, leading to an increased return on investment (ROI) and improved marketing efficiency.`,
      },
      {
        id: "block4",
        type: "contact",
        blockNumber: 4,
        to: "yourname@yourco.co",
        subject: "Weekly Campaign Analysis",
        body: "{{weekly_summary_draft}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "sales-book-research",
    name: "Sales Book Research",
    description: "Let agents help you stay on top of your sales book",
    agentDescription:
      "Benefit Metrics: Give your sales reps 20% (<a href='https://www.revenue.io/blog/sales-reps-spend-20-percent-time-research?' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>) - 40% (<a href='https://spotio.com/blog/sales-statistics/?utm_source=chatgpt.com' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>) of their time back by automating their sales book research. ",
    tags: ["Sales", "Data Analysis"],
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "The attached file is my sales book. Please review the list, and give me companies that have not been contacted yet. Respond with just the company website",
        attachedFile: {
          name: "incoming_leads.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1K4odunObdU0MV-0M34fxqzY8h6QNZ1hq/view?usp=sharing",
          content: "Sales book data...",
        },
        outputVariable: {
          name: "uncontacted_leads",
        },
        output:
          "The uncontacted company is EchoStride Solutions. The website is https://www.echostridesolutions.com",
      },
      {
        id: "block2",
        type: "checkin",
        blockNumber: 2,
        outputVariable: {
          name: "uncontacted_leads",
          value:
            "The uncontacted company is EchoStride Solutions. The website is https://www.echostridesolutions.com",
        },
        output: "@https://www.echostridesolutions.com",
      },
      {
        id: "block3",
        type: "webagent",
        blockNumber: 3,
        url: "{{uncontacted_leads}}",
        nickname: "prospect_website",
        outputVariable: {
          name: "uncontacted_website",
        },
        output: "Website processed!",
      },
      {
        id: "block4",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "The attached file shows how qualify incoming leads. Using that as a guide, analyse @prospect_website, and summarize whether or not you think it would be a good lead.",
        attachedFile: {
          name: "lead_qualifying_guide.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1zOaW3OKihzAgOgnZcL8A3w6COqS4SX7O/view?usp=sharing",
          content: "Lead qualification guidelines...",
        },
        outputVariable: {
          name: "lead_summary",
        },
        output:
          "According to the guide, I would give the client a **proceed but look at sales volume**. The website shows that the company has a strong commitment to sustainability whcih is a good fit for our brand. It also has a large variety of SKUS, suggesting they may have challenges with logistics and distribution. However, I wasn't able to see a follower count, so I couldn't verify if the sales volume falls in the ideal range.",
      },
      {
        id: "block5",
        type: "contact",
        blockNumber: 5,
        to: "yourname@company.co",
        subject: "Sales book research",
        body: "{{lead_summary}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "csv-to-formatted-spreadsheet",
    name: "Raw .csv -> Formatted Spreadsheet Agent",
    description:
      "Transform raw CSV data into beautifully formatted spreadsheets with analysis",
    agentDescription:
      "Benefit Metrics: saves ~1 hour per spreadsheet analysis. This agent takes raw data and creates a formatted, professional spreadsheet with analysis and visualizations.",
    tags: ["Data Analysis"],
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "analyse @sales_data, and give me the average sales and unit sold per product",
        attachedFile: {
          name: "sales_data.csv",
          type: "csv",
          url: "https://docs.google.com/spreadsheets/d/10wb4KOm-sMQFU59pP3GlM3gZ_o4BJDh0vTOu2UD7rUM/edit?usp=sharing",
          content: "Sales data content...",
        },
        outputVariable: {
          name: "data_summary",
        },
        output: `Based on the data provided in the source, the average sales and units sold per product are as follows:
Product, Average Units Sold, Average Sales
Printer, 4,800
Laptop, 1.5, 1800
Monitor,3,900
Desk,2.5, 1125
Chair, 5.5,825`,
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt: "summarize {{data_summary}} into 1-2 concise sentences",
        outputVariable: {
          name: "written_summary",
        },
        output:
          "Among the analyzed products, Printers had the highest average sales at $800 with 4 units sold on average, while Chairs showed strong unit sales (5.5 units) but lower average revenue ($825), indicating varying price points and demand patterns across the product line.",
      },
      {
        id: "block3",
        type: "excel",
        blockNumber: 3,
        userPrompt:
          "Make a spreadsheet showing the analysis of sales data - make the font calibri everywhere. Make a table with {{sales_data_summary}} - bold the headers. Also make a bar chart, with {{written_summary}} as the label.",
        output:
          "https://docs.google.com/spreadsheets/d/1Tcavez45sR1cyE-F4iH1STz0yQJeRpqD/edit?usp=sharing&ouid=101486709579123358134&rtpof=true&sd=true",
      },
    ],
  },
  {
    id: "meeting-follow-up-tasks",
    name: "Meeting Follow Up With Tasks",
    description:
      "Automatically extract tasks and sync them to your project management tool",
    agentDescription:
      "Benefit Metrics: saves ~30 minutes per meeting by automatically extracting tasks and syncing them to your project management tool. No more manual task creation!",
    tags: ["Project Management", "Admin"],
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "read these meeting notes. respond with a json object of the summary of the meeting, and the tasks (each tasks hould have the task itself who is responsible, and the dud deate).",
        attachedFile: {
          name: "Meeting Transcript",
          type: "pdf",
          url: "https://docs.google.com/document/d/1gojUbH-FU4Nqz6mSSOIPCg3a5b3ibGiBHJXliE9_XpU/edit?usp=sharing",
          content: "Meeting notes content...",
        },
        outputVariable: {
          name: "meeting_tasks",
        },
        output: `{
  "summary": "Weekly team sync focused on Q2 planning and current sprint progress",
  "tasks": [
    {
      "task": "Update project timeline for Q2 initiatives",
      "responsible": "Sarah",
      "due_date": "2024-03-25"
    },
    {
      "task": "Review and approve new feature designs",
      "responsible": "Mike",
      "due_date": "2024-03-22"
    },
    {
      "task": "Schedule customer feedback sessions",
      "responsible": "Alex",
      "due_date": "2024-03-28"
    }
  ]
}`,
      },
      {
        id: "block2",
        type: "make",
        blockNumber: 2,
        webhookUrl: "https://hook.make.com/your-scenario",
        parameters: [
          { key: "meeting_summary", value: "{{meeting_tasks.summary}}" },
          { key: "tasks", value: "{{meeting_tasks.tasks}}" },
        ],
        output: "Tasks synced with your Airtable via Make.com Scenario 345",
      },
    ],
  },
  {
    id: "weather-api-agent",
    name: "Weather API Agent",
    description: "Get real-time weather information for any city",
    agentDescription:
      "Benefit Metrics: saves time by automatically fetching and formatting weather data from any city in the world.",
    tags: ["Data", "API"],
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          'Below is a question a user has asked via an API, about the weather in a given city. Only respond with the city name. User question: {\n\n"What\'s the weather like in Auckland right now?"}',
        outputVariable: {
          name: "city",
        },
        output: "Auckland, New Zealand",
      },
      {
        id: "block2",
        type: "code",
        blockNumber: 2,
        language: "python",
        code: `import requests

def get_weather(city):
    # In a real implementation, this would call a weather API
    # For this example, we're returning a mock response
    return {
        "temperature": 21,
        "unit": "C"
    }

weather_data = get_weather("{{city}}")
print(weather_data)`,
        outputVariable: {
          name: "weather_data",
        },
        output: `{
        city: "Auckland",
        country: "New Zealand",
        temperature: 21,
        unit: "C"
}`,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "Using the weather data, create a friendly response about the current weather in {{city}}",
        outputVariable: {
          name: "weather_response",
        },
        output:
          "The current temperature in Auckland, New Zealand is 21°C. It's a pleasant day with mild temperatures perfect for outdoor activities!",
      },
    ],
  },
  {
    id: "instagram-profile-watcher",
    name: "Instagram Profile Watcher",
    description: "Monitor and analyze Instagram profiles for insights",
    agentDescription:
      "Benefit Metrics: Automatically track Instagram profile changes and analyze engagement patterns, saving hours of manual monitoring.",
    tags: ["Social Media", "Analytics"],
    blocks: [
      {
        id: "block1",
        type: "instagramagent",
        blockNumber: 1,
        url: "instagram.com/cobani",

        postCount: 2,
        output: JSON.stringify([
          {
            imageUrl: "https://m.media-amazon.com/images/I/71n5WjmCrcL.jpg",
            caption:
              "New! Chobani Greek Yogurt, now in 100% recyclable packaging",
            likes: 1200,
            comments: 45,
            timestamp: "2024-03-20T15:30:00Z",
          },
          {
            imageUrl:
              "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMTEhUSExMWFhUXGRoWGBYYGBoaGBgeGhseGRoXHRsaHygiHh0mHR0bITEiJSkrLi8uFx8zODMsNygtLysBCgoKDg0OGxAQGy0lICUtLS0tLS0tLS0tLS8tLS0vLS4tLS8tLS0tLS8tLS0tLS0tLS0tLS0tLS0tKy0tLS0tLf/AABEIAOEA4QMBIgACEQEDEQH/xAAcAAABBQEBAQAAAAAAAAAAAAAAAwQFBgcCAQj/xABIEAACAQIEAwUFBQYDBwEJAAABAhEAAwQSITEFQVEGEyJhcQcUMoGRI0JSobEzYnLB0fAVU+E0Q3OCkrLxkyQlNWNkdIPCxP/EABoBAAMBAQEBAAAAAAAAAAAAAAABAgMEBQb/xAAwEQACAgEDAwIEBQQDAAAAAAAAAQIRAxIhMQRBURNhInGB8EKRobHxBRQy0SPB4f/aAAwDAQACEQMRAD8A3GiiigAoopC9ilUgTqeVKUlFWxpWL14TSAuyJGxoqNfgKFs4ozikaKNbChbOKM4pGilrY6Fs4ozikaKethQtnFGcUjRRrYULZxRnFI0UtbChbOKM4pGijWwoWzijOKRoo1sKFs4ozikaKetioXBr2m9eqxpqYUL0VVeE9vcHeum1nyHOUts0ZLsaDK2wJOwME6RM1aqpNPgGmuQooopiCiiigAoorl2ihugGmPxZXwrudz0/1qO93LEQdTr/AK1IYizmpu75fCkZjuf/AD/YrzsmKWXJ8XBvGSjHbkXLrbWOn1/vWkFxjGDlyrzJ3jQA/X9POkEjKwJM6SxGmgM7/eg+sx512FKyQM0alifCREkiOYKjqa6kklRmcpi2ADMwIkbAwdxG3pr5V6bj58uc6GCI3578v5VwcQBoHQRBIVfMDmPMf2K5GMEFhdGkfc/ENF23/wBKYjtr7anOYkxp5x+X866F8lT4z4RqddcxGU/qKSuYxNxdAA/c20JAOnSj31JIN2Z0BCRBnbQTuKAPbd9mOl3kOUbnT9a9N5t85giQPWDv5Zl/vYu4q3m/agTBgoTuBESNJzA/OuFxYMReGvPu41GsbdKAFlus7AK+8CPONdfzrlcVyz6mI/Jf1M/lXiY5NftAwGUzkIiGXfSTMiuXxK6lboAzbFDpJIjbyP0oAUtYg5lGedYg8/Ly0/SvGxBBPjO+22kyB9OfnXWGuZyctxTsSCkc4nbYkH607ewxiGA1PKZB2Hy/lQAzF5g4TPJmI169foPnQmKM/ESN9uQBP+vypf3a5/mDrOUTXXuzQQWHKDEEQf6aUgGtu6zSouGToNNtRz5102ILN4XIkQBGxMLM+R1pYYVwZzj5qKUuWGOxAMztP9xQAybEHQd4ZIAGnOBr89d+td2MUQYLTtvpuIHLzB+VORYeD4lkxByjT5eetHu7QRKnQxIECYjSP7mgBG3jW3IkaajeDz0/pRxNmuWbqWWAushAzaQWHlzg/Wk3XKIZSv7y6jnEjyn9eteFQImGLfeHrp6nY9ZIOsUDWxjf+E3Lbrav3DhkQ5hnXTwNJ+HRdY8THXl1rRuzXagJdXC3L/vAf4LoGqnoxEgqesyOem0rxDhVvEAC4YuahXXUkD8XIiZ5/PeoPhPYs2MSt8d2oX4oEh/wkCRlblqDzrnbnCWy+/c7NcJw+Ln74NCopvhbu6mNNvSnFdsJqStHC1TCiiiqEFIudaVY6UhUTY0N8bicizpJMCdp+Wv01qOf94ACJfWT/Dt1/meQpbGktdCgEhBm9TuND8tRSaJAhiTll3HPn5RtHMbneoKPWutlAIzM2qLGw6sZ+H19eU07t4Lm5LaggbKsTAAHkY8+lc8NtaG43xPJ9FJkCen+lPaQjhLYGwA9BXcUUUAFI3MVbUwzqCI0LAbkAb9SQPVh1FLUyxXDLdzNmkhtxMD7uo5g+BP+n1oAcd6g1zLBMTI1PTzMD8q6a6oYKWAYyQsiTEAkDnuPqKRXBKBGpAYOAY8JGsjSd+tccQwltouPI7sMZBIIBBzbeX6DpQAquLtmIdDmAZYYeIMQAR1BJEHzFAxds7XEPwj4h9+MnP70iOsiKjTfw6jJLLlXMNZKjvdNTI0deemnSuGtYUErLA5rdvRjJbJ9mNDvl57TG8aOhWTasDqIPp5UguNtHUXEOmbRhsZg77eFv+k9K4a6lmAzGGLESNvvECByEtrJgN0qPFuwSoJfOqhQTAYeJgAQBE5p5RoJ31QWSnvtv/MTl94fegjnzkR6ivRi7cxnSc2SMw+L8P8AFodN9KiFGHMhc5YC1JgMdkCEhgRtl3GsneNJJMCoOYFgc2fl1Y5dtpdvPXemFigxlsxFxNRI8Q1A3I11Gh+ldWsSjQFdWkZhBBkddOWo18xTazwq2ptkTNvRToIEMsHKACIY78wDuKVsYJVYMJ0QJHKBEeZOn6xuZQ9xzRRRQAUyxFjKGKiQRqnL1+Wu1PaKAInulgayScwM7Ty9fWOWxNOsxuWyB8X9kH50hibIE24EfGnrrI6AQK7wejTI8W8Sdf05GlJKSpjTrcc2UKxA2p/TelrZ0p4YqGyFJ2dUUUVuSMuMcStYe0bt5wlsFQWMwMzBRMDqQPnXOBxtu8guWriXEbZ0YMp66iq97WrTNwu+qCSTbEDeO8Wfymqf7FeIlrGJw7GcuS6J/fGVx9VX/qrKb3NIx+HUX66rC5dbI3JQQDJ8wVIPIV7i1YI4CsSYQQp01nlygfmNKe3raB0XIninkOXypK7b1aEQKBoSg8tdjPP68qRJIKsAActK9qOsKpcIVQ6TOQayJj8+nKnQtKriFA8LbADmvSkAvRVL9o3bb3BFt2grYi4JAbVba7Z2HOSCAPI9IMJ2d7JYzG2VxWM4hikN0Bkt23ywp1ViPhEiDlVRpz5CtO1shz3pGn0VhXYztribGMSy198RYe6LX2hLGGbItxSxLLuDlmIkb6027VcbxlniN+0uMxOVbxgd84ADEMFgGIAMR0FPRuT6qqzfq8dQQQRIOhB2IPKo3iHaPB2bnd3sTZtv+FrigidpBOnzqSVgQCCCDqCNQR1qDWxEYO3+AdNtd82+/wAWvrrXpwqGZUGdTPWMs+saTTHiXaPCYdsl7E2bbfhZxm9Su4pzw3idjEKWsXrd1RoSjBo8jB0PrRuK0OXQHcAx19CP0JHzpH3G3+AaCP1P8zr+8etY17U+LYqxxB0tYrEIjJbcIt11VZGUgBSANVn1Y1pPDu0uHs4XCnFYq2lx7Fpz3jjO0oJYg66mdapx2JU020TyYVBsijbl0iPplH0FLUjhMXbuoLlp1dG2ZGDKfQjSmHE+0uDw7ZL2Js23/CzjMPVdxUl2iVophwvjWGxE9xft3Y3COCR6gaj50ni+0WDtObd3F4dHX4ke9bVhIkSCZGhB+dFBaJOiozH9ocJYy97ibKZxmXM6jMDsw11Xz2pl2uyYjh1/JiLSJctwt43ALWpEAvtlb4J/eooTZNYfFW7k5HR40OVg0HoYOlLVj/si4I1rGPcOIwxi0y91av27rOJXxFbbGFHU8yOtbBTkqYoStWxtjCQUIBOsQBMz8tBTDLly6zDdQemhjYabfrT/ABonIP3xPpTDISTzh5EQY3jnpz1oKJdiACSYA3J2FI8J4nZvhzZuLcCMUYoZAYAErI0J1G1Yl2y4nib+JuW7945LLsTbWVtgKSAGUHxEkDUyd46Vf/Y7ZKYS6CrLN4tLCC0ohLRyHKPKlCScqNZ4XGGpl9ooorcwKn7UsW1rht64pAYNaiRIM3FEH1mJ5VlvsptYj303rdpzh3S4ly5p3YBhk1mCwZQsCTrW38cSwbJGJCG1KyLgBScwyyDpvG9Jd9ba2RbZCoGgQggDyisZ1qNoyeihTETnTwgjWTBJG0QRtSF63rc1AJidYEfMenOlMT+1tf8AN+lJYi1q7HwzEHTloIjWT/OkZnuGuHOFnQKAOnwj606b41/hb9UptaJzqM8eAHLzOmpMg8/OnLfGv8LfqlAHz37VL7PxLFT93Ki+QFtdPqSfnX0Jg2U20KfDlUrHSBH5VjXtl7PvbxPviqTauhVdh924oyiegZQsHqD5Sn2P9p74WyuHvWe+RBltsrZXVRshBEEDYHSAANa0atKjnjLTJ2aDh+wHD7OJGLCkMHDqrP8AZK5OhAPPMdASRMQNqyDt/P8AimKjQ96IPQ5VirDiu0uI4zjMNhrdvu7KXFulQcxhDLXHaBsJAERLcyRFe7esP8UxJnTvh+QWaqKd7im01t5LL7VeymHwlmxctBu8e4y3XZ2Y3SVLF2kxmzAnSPi9IU4B2nu4bgNxlb7QXzh7J/BmUOYn8ILkfKpj26n/ANnw/wDxj/2GqzwThD4ngN8WwWe1ijeCjUnLbQMAOZyMxA5xSW63B7SdeCR9jHBrV44m/eRbpBVB3gD6tmZ2OaZJ8Ou+/WqxxW83C+K3ThyVFq5IWdGtsBc7o9Vytl16A7iatXsL4iofEYcsAzhLiCfiy5g8ekqfrVY7V2Dj+L37eH8ZuXFtgjUAIi23f+EZSZ6Cn+J2J/4KuR37YXDcQzDY2LRHocxqc4v2EsHhK4xM/vC2Ld93LswcBFLKVJgAJosRGUCoL2v2wvEMo2WxaX6Zqv2O4taXs+GziGwi2F11Ltb7rJHUNMjllPSlbpUNJNyspnsb4ncXE3cMrQt607AHZbiAZXj0mesDpSvYrhwwGLu3OKGwgNtgO9dLlx3ZlOdVBZoIDSxAnMPOmHs2wF8DF460p+ww94WzE5rpWQAOcAGR+8o50n7MfdHxrXMa6E5C6G8wys+YSzF9CwEkT5ncU33FF8EbiOI27XEzfwLRaF4NbKgqMpIzKAQCFMssRtUv7ZLYHEmgATatk+Z8SyfOAB8qiu1GIW9xK7etAm215crBTlIXKsjTbQn0qW9rDi/xAvZIuJ3SLmQhlkFpEgxOopalaLWHJJOot79kyR7T9l7CcHtY2GbEsth3ulmJYXAoyROUKqkAQNMg85Q7B3y3CuLWW1RLRuKDyZkuEkfNFPqJqY7U8Ts3OCWsOlxWvLbwwNsGWBTLmEeUH6VBdgvDgOLhvCTh9AdCfBe2nfcfWkpJrkueGcJbxa28HnsW/wDiLf8AAuf99utzrC/Ysf8A3if+Bc/7rdbdh8Uj5sjBspgxyNKfIsP+JxjQfBH41pgySTp9/wDrrqR+VP8AGkeD+MR60waGJCgyG11mYJEwOX5a1JqZj28wIscQv3nju7nd3QNNSEjKOp7wA/M9Kunsgx5vYS4zE5u9IYGYHhUiJHSDppJNO+1uF4fddVxX7RVJDKSHRSYkxsCdBI1IPnT7sVYwaWWXBEMmc52liS8AEktzgDbSoglrOic28SVMsNFFFdJykF22tK2EdWYqCU8UTBziJHSd6zzse7jGd2VQqguBn5hgpEAjdT5z8quvtPxxs8Ou3QAcrW9DtrcUfzrPfZbxLvcXe0IzWWfLPhU5kBIHUzrXJlg3kUqOzFNLC4/P9jV8XfUXUmZkDeF10nz+XzOlJ3rfx5pOugBH4tORP19KSxIBxSydoEE6CQflMxp6GlXBXvGKgjVtRpodCTGunKtTlDD/ALVNCPs/XnAnQaxT1vjX+Fv1SmFsgeJQc5RZj4fhEQP73NH+JW0ZRduqrZWkMwBEssSDEDQx6Um65AecRjurma2LgyMTbIBDwJywQQZ2rNcNwvgmID3Gw7WnVS5ti5cUMNvBDBSJ6R6RVu7cY8rgy1ptLjpbLqZ8LtDQR1Hhn96s0xuHa1cxAbdC9sNsPigDptrFY5MsocGUrlJRSs1fstw/C2rCthLS20uANoPEf4mMkkajUnnTTEdhOHOzO+FUs5LMSz6ljJPxcyap/B+2Qw+Bs4e0JveOXuCLa5nZoB5nWOQq9dksYLmGT7Zb1wD7VgwaHbxFTG0TAG0DTStI5LdXubywZIpa4NfNHXFezOExIti/ZFwWgVSWbwgxI0P7o36UrwXgWHwgYYe0LYcgsAWMkaA+ImpKuXcAEkgACSToABzJqrJpcld4r2E4fiHNy5hlzkyWRmtyTuTkIBPnvTzgHA8Hhc6Ya0iMIDkSX11AZ2knrE8x1qOx3b/BI4RXN4nnayFRHVmYCPMSNDVUudsLgGINk5GvX1dGYCe7ykHTUH9mqyJHi3moeVLazSfTZIR9RwdeaL1xLsngsReN+9h1uXCoSWLEQNvDOWfOJqt8c7IcHwai/dwxgtCqHusGaCYyl42B300qx9j8ZdvYVb99gWcsw0ChVBygaembX8XlXnbHAe8YK6q6kL3iR1Txaeokf81U5OthYIY55I61s2rKFjO3l0KLWEtW8NaUQoVQSB5CMq+kH1rzsJ2VtYk3b15DkGwUZA5MljKgaCIheZ8qqQrS/ZXiHNm+hYlUK5BOi5gxMdJOtc8JOUtz6XrMMOm6dvCkntv3588jbhfZvA3r1tcjqWw/e3LOa4O7bMgGrAN95xr+HlSWD4Th1w2OnCNcNu5iFS5KkgWyQsEtK5Yk6a+cxSfs0x929jGe7ca43u5GZjJjOhj0kn61M8J/2Xi3/wBxjP8AsqopNWc2aWXHNwcm60933f0KKvZXGkIRh2IeMpBQgyCwMhtBA3MD6004twa9hmC37ZQnVToQY3gqSPlvV47U3GXg+EKsV0sSQSD+yJ3HmAfkKX7clrnDsMWUtdY22gAlpNslzA9dfUVDgjqx9dlco6kqcnHve3fkoHZ7ENZxVu9atq90EgCDrmGUjTyJ15b1tPA0Hd5+4Nh3MuhIJBHmCQR0232FZT2G4cb2Mt9EJdvFlYZRpsQ28DTrrvWz1phujz/6x6ayJRir5b+/5GuOHweTjp/Oo22xBeCRNzXWJOvOfTeKkseNF1AhgZM/yqOw+XM85/2nIRrrrIO1bnjmW8Ttm5jcZecAxiHtLOulsBQB8iK0T2YIow9wrubmvTRFUQOWgFY/i+0Fy3cxFpkU/b3nJ/eZzMajePPStS9jeNF3C3WC5QLuXeZi2kn61z44T9bU+Dsyzh6CiuS/0UUV3HARHavgSY3DPhrjMisUOZIzAowcfECNwOVQnZrsZYwC3WtsztcUKWYKICyYGUCJ0nl4RtVwubU0xXwN6VlPkpPahtibrC/bUHQhpHX8v50li0E3DLFgAY0Gmmg0MzoNRRi1/wDabWnI6/IzOnpzru/DZ7YOWdyczAz0EjX06UhjW7Y7xCiHIzWgA+uYSgjoNBz0+VZvxXgmPVsvcm4OTWzIMaE+HaPMVqWYKQBHwfFBJJAy9Z5evnUbx3E91hC20Iw+TOgI+hissmOMt32EsPqyUfLozjBPft2Xsjxi8Q3dNBRSpDZ8xjXTlppqTUficQzOrs3evJzI40U7Ebxv6bA1LYts2mYhmExJkQFBBJG8zoNR4ahryKCz5sy6lmIMkn4ieUTrPnvXLVn1vRdLiwQqK+b7/n4/IaksusOpV9vuqYMCDs0g/IeVPcFxtsPiPeluCQdj4O9WNVZV/U7ETqaizeN0RaXKIAzk7kT4gN4206zqBTDEcMBhrhZjzJO/0q4pJ7mHV5004wXPJ9GcC4xaxdlb9lgysNQCCVbmjRsw6Vivtm7YnEXPc7TkYdD44/3zDmeqKRAGxIJ18JpbhPbFMHwq9YtsoutdIUKYKI6jM+mxkEA7y08qy3GYlrjFzuemwGwAHIAaV1RdngenpbL3wi7NqzcnKshlMBlBGjFgJkiAAI/1liWFsIWUi40qzQuQzqddgfXb1qgcE4jesyAqsh5ONp5qeR+tXHh758hUjxKf2myx0jWY/XymuXLFxZ9N0WfFmhpfNbprn5Ft4BZv41rVjUYe0sMR8IjcjkWY7TtJ00rUcNh1tottBCqAqjoBoBWXcFbEL/szQ8k5FykERmYMs+WnP0NX/s9xn3hSHQ27yRntsCCJ2YA6wf789MVfU+b63BHBncY8Pdf6Ml7VcL92xVy0PhnOn8LagfLVf+WvODdosRhVZbLKoYyZVWJIEbkVqXajspbxptszsjJIJUAllOuXXodQddzprXGB7D4K3r3XeHrcYsP+n4fypelK9j2Y/wBUwSwqOVW+6rx8/wAzLOEccvWLjvYKh3kEBFOkzCrGgnkOgqVscb4gFuBLTZbrMzxh5DFxDE+HnWu2bKpoqqvkoA/SlJqlia7nNk/qmOTv0l9f4M74vx5LfD7VkIS9tbSlb+Gud22QAH9ooEgwQfKqjie0eJu3Ree5mYAqBAygGCQFGg2HmYE1teOxiWkNy4wVBuT5mAPUkgAedYV2g4kmLxhcBQoDRbQABo+ENHxMdyT6UpxfkfSdXjSf/Hvvu2u/0LL2Iw9k4hbpxpS4Dna0yZC4JOhYsVIJ6T8jFavXztdvFMRbEZFQ5dRAKySzR+Hc+kVNezTjOMu8Q7vDMxwszcR57tbY0zAfdcnaNzvIBi8apHJ1k3llqb9qNk4llyjM2UTvBOsHkKYqk5oYMQ8sBAynXST8RqQx8Qsz8Q2iT5a1FKdX1n7Tny+LbXyrU4BrxL2fcOvu1x8OA7EsSjukkkkkhWidTyqT7J9mbOBS4lgvluP3hDkGDlVYEAaQo3mpWlLVOHINuhSiiitSTm5tTTFfA3pTbtRxIYfDPdLqkFRmYEgZmC7Dc6wB1IrEeO9sMd3z37N+6tlzCKSI8IAJKNIWSCY3isZv4jWEG1Ztt61N9TJ01AyGBoRGfbfXWuL7g5wRAmDA+IzG8ydd9vnUH2T7Q++2sLeLAOQUuqNB3ig5oHQ/EPJhU69ye8kfDqBEbHckGTQScvb8QiMwQBRqDtvtHXakOJ4E37DWiAS9u5pyJDKRrJO4Gv8A4pYISQNvs4+9A8pjXQ8iee1OMH9zUHwvqNB8S+VJjjJxakuxh+IupZAzsxcfABMknKYiZDbz0K1FY+9nYd+xzEhhaWGWCAymF+Jteeg8q0Ttz7Pbly/cxthy2eM9gKFIAAko06yRmI0Jk6naqE3FtO7sW0WN2AIT5swzMfKuZx0nuvr/AFVsvpz/AD+w4uWbmQsgFpOT3N46x/IgVB3bWbS2Gukb3bjNlHoNvpUnbxCtLEm8wB1bw2EPUSYn0n5VH4rFjUM7PGyWzkX8vGfnUwuzCbvd/f39SMx2DaIzgnU5QAAPQfzpnY4aTv8ASrb2U4IcXdu2grW3W015BCyWSIDZznYGY8I0LAnzd8G7J4zGKTbBSIk+GDPKWI1/0rdNpHM9Lbsr2GwZ5gxT+xixa8Wmm09OYg/qNRVsHssxZGlxlbq14AH/AKQ1S/AvY7aVxcxl03oM92Ccp8mYwSPIAesaUtLfI1nWPeL3JP2XJ31sYoKyoMyLIjOZ1cdQNRPMk9Kv1cWraqoVQFVQAFAgADQAAbCu6uMUlSOXNmlmnqkM711hc1Phjb6R/Ou7uNVJzmIEz5DWmwBzsTvJA9OX5VH9sOJ+64K/iABKrCyJGZiEX18TCuSOSbk1HyNxW1mQ9oO097HYj3kZlt29LNoHkScxBGneQFb5wNBUv2Z9oeLs+C7mxaTpmUo6DnNwjX0M+tUjhOJFsZbpuWlJkEKSmwAlfIAagGrFir1tLS3BcN/MYUHKLY5yVXf0NdEm0zoUISXyNVbGYbi+EvYdGKllGYMvitmQyNGxhgDoeVZzxn2b4zD/AGtpRdymfs2gkfwtqG9Jq6+yXCxYvXjq1y4VJ65OfzLH5QOVQXtTvP74Fz5FWxbcEmFzd5cEjXwtpofIeVU3tZjFVNxXBRsfwvFXnULabKfidm8R/dIOqxtAnetv7DcDs4TCqlo5y3iuXIgu/PQ6hRsByA6yTmTojYdS9u/YvsoYEPd7twecM2k/lVl7BcfW06Ya4Utpd0tjQS8xOnNtj1MczrnDI9WlmubFcNSL/wAQYAKSCYYHQxtTBcQ8sJUQ+UaLtJ018/noakMdso6sBz56cjTBHcFzuM+5EaGZiQJ5Ca6DhJilLVJ034TxJL3eZNQj5M3UwCSPLWPOOkURe4U6skKKKK2JKt7TrObht8THwEGJ1DqQI8zA+dYh2rxNnw2rYJVDG8eW3WOXLXzra/apauNwvEC0rM/2ZhQWaBcUsQBrooJ+VYFwThr4y6lmyMzEFm1GUDMMzk8gJHnqI1rDJC5pnTinUGi+exDGMLt6zm8HhcKVBgwVMPykBBHPLpsa1XE/7wlpCicgJ/OQYNQ3Zvs9h8Fksp3jODLXDEOxWSx5wRoANsvqTJYsr9tJIaBvlGn3V0Oo9YNMybti1tfhaYXIIUGT8PMCAd94pbCR4I1GV4OmviXppTbSFJGndKIzCTpO0+o50p32VVI/C/oPEtTKSirYkrdDj3rU6aAx6xvUR2p7K4fH24uDK8eG6ujDyP4l/dOnpUha2g6f1pzZIUEkwBqSdh1NcuLJKUqkatad0Ypx72b4iwy5UuY1Ttki2qRyK5pHlBINVrH3WSUOSwy6dygl1PRidA3lBNfR+Ex1q7JtXEuRvkYNE7TB8j9KHwNotnNtC8RmKKWjpMTFbuCZos8o7SX/AEUD2O8FvW0u4m7byd8ECZjNxguaWP4VMiBA2npVqwHFb+IVrtlbfdLcKKrTnuBGyu4IML96AQZ0kip2oLh/Br1gulm8gsu5uBWtlnt5jLKpDAEdJGk86qqFGUZanLnar49+O/8A73EuEdowzvbvaN7xdsWyqMEOT4VLajMQCd6f2OP4d2VA/wAWfIxBCP3ej5WIgx+gkSKjbfZpwVPeLpjHxfwnUMCO738zr+VNsB2ctuqWO/W5awxvIAg8YN1SuR2kiVVjsNdJiIM3I2lDpnbTf0+vt5r82TC9orBUvmYLlRwSjDOLhyoU08WYiABrtTbH9oP2XckScUmGuq6kMmaSdJEGIg6gg6UzscMN7Drhhi7Nw2MhttbUFg1pgUNwBzOgykCNyZpa52bZn77vVztiLWJaFOWLS5VRdemuY9dqdyYKHTxbt/v7V2XuP7nHbIZlZbgZUe4A1tgXW3oxSRrGn1B21pt/j9h8Oj3kMPa757ZQuFQAFnIjVASIPONNqYYPsg6MpN1DCX7bN3Z7y532zu2bVh/e+ilnsrcU2G7y07WrIsFXtM1tlSCjZc/xgyemvLel8XgNHSr8X7+/t8hl2g9n1rEjPh7zWSRMftLLg6jwnUD+Ex5GszxXsy4iLwV1zFmCpctmbcdW2KD1A+db3w/EpcQMjrcX4c6xlJXQxGm45U4qqXY5vUknT/Ui+zPBlweGt4dTmyAy34mYlmPpJMDpFZr7b8FcF7D4hfgdGsN0kEuo85BY/wD4616oztJwVMZh7mHuaBwIYbqymVYehA05iRzpkRlUrPnrGdo7xXKpdUAWVMxMjYbQdOWvOaY3uNXgM6nITJBVQonYzlH6aa7VpmG9jGn2mM/5VtaDrBL/AMqmuGeyPAW/2hu3+gdso1EEQgEj5/1o0xRq8zvku2PWcmv313nXy0BpmczkgSYfqdBr6/3HSnmOA8GseNf/ABTK4sSTDAvMTMb6mDp8qo5zrtTg3u4W6iE5okANlzQZKz5iR01qE9lCnuLzM2ZmvSd4HgXwieQ/vWauFQfY7AX7JxQvAQ1/NaIIINvIoWOYiCIPSpjF60zRSXpuLLJRRRXQYnF06UxvKuV2AEn4iAJMdetL8S/Zn5frUbhwcrk/hH9J/KuXJlrKoVyaRj8NiLADFR1bNqTvk1EH6yD5U4uhlZ2OWWiFkTAMTqNOXXWm+JCqXQXLpbKRAy/hJAGk8+VN+GZvH8Q0XqoidT4m3I212NaCJFbUsJ1lJiDoI68tZ6UphYYJIGqvI5fEtImSykA6JBgSNthyPr5Uvg1IyA75X8vvL1pAL+7rGXKAOgqv9uLZGHSFJtLftPfUAmbStLyNyNp8hVloqdCNMWVwmpc0VfjvGLQtm9hriMS1lL123DZLJfViRIEAmJ2zE0wv8Svot68tx7ljDYldRB7yyQveLI+LIx38iCTV2CgaAUACI5dKTi/JtDqIRVab+fjb2+ntZSsfj8QlxLL3xYLWDdW5ccKouM5LLJX7Tu1yqE0kEk8iPWx2ILY65bvs7YfW3aAGU5rE6pGYw5kAn7sVdCKIo0+4/wC6jX+C/Tyn48bc9yjPxm4LIuLila3cuWFZlYXHsI2juzwApaBoR4ZMeTzs89sjiXiNxO9aSrZnK9yux5nQgHyq25RtApO+SBoP7AJo0hLqYuLSjV/7Xt7FGs4i5bAtW79vEocNeFu7bULfsqiAqGKnYkKNgZHlXfC8QX9ww9rFMqPhmLZGQnOgSBtOkkZZ+7HWrd3xzGAAJOsbxtr5mKMNdYlZAHlHkPpufpRoKfVp/h/bmnvVV3/T3Kbh+M3b99Ut32t9+mJVVa4rOj2z9nK5QLbA/dEyu/Uq8D4pib12yGNxUvouXX4DhyoxE/xGV+c86vOUbxQBRpfkJdVBqlBfd+3y/L3M/wCB4u4gsLZuFnfE3w9iQR3eZ2LkRKx4Tm/fHIgV4nHL5wd2/wC9KtwWGLWpBuLdVtWylfsgD4MusyOdaCAKMo6b7+dGh+RvrIN24Lm+3luuPf8AQp+K73vsLYXG3QL6XnLSmacilIMbAkkAU7wd2+MZcwzO5UOMQrHbuipXuv8A1fqAassU2wmBW2zuGdmc6l2LQJJCL0UEmB50aTP+4TjTS4rhc3d8eNhyxgTTbDYwNvAr2+SWC8h4j59BUdiVhjpvXNmzuEtuDKEE1uSWMJ8MGPEOuvlpTNwpkFyIbod9dBG/+n0HByISCTnEDy/sUnciWifj5wOu0GuuEtUUzJqnRMUraqN4i7bAkDfSl+FElTJnX+VRDMvV0UNw+Gx9RRRXWZjfHglDHl+tMUHgc+QH0n+tSd3amuJ+BvSubJjvIpmil8NETcTPiDIMSVYePTwwR8IWP5nfalUtoO8t27cEAKSGkttOk+f61wqRifgA8UA5Rtl3DZZE9J61x3iziCpnQQyzOm3iB6/zmrEOspkZQRFsDQwJjrt01pbCH4CY+F5Mz95ecmm6lioBkL3YgwY+EbmnOF+5t8L7fxLQIa2eNA6NbZWEZhI8JMmCWy7ATI0iIJpO/wBo7YDQr5wtxghAWe7mQTOklX/9NzyqUXDIIhFEbQo09KjcVdZLgtpZTIconJoM+ZdYMGCZPkxo2E7Fl4uhJAS4SGyHQaNmyZZJiZ89p6V4vGFKMyo0i33uVoEqRKnQmA2sfwN0qPt8UgKzWEkKJyjX9n3oy6dYUL1O55ub2JhSQqLNrMAwzq8ZgLa5WAgATA/HPWihWOMXxq1bYhs2hIkARKgEjflmUa82ETSR44oJBRviCqBlkyoYE6+GfFH8BpMcRUadwo1CmNhDlAx8P7MROblI050liOJLJJsKYDbgamckZiPDMTqDKsh50UFj+9xMKzDLIDi2IPiLHJAggADxjUsKSPHEKyqudA3wmMp+FtJ0MGIGpEUlb4lnLHuAzKjsDoS2VmyKJEycoOkxmXqK4fFhW0S04gEOqRDN3hbSTM5BOoMkTPIoLHtzigBTwkrcUOpnXUgEHkNWtga6l+QBNcDjlv8AC8AamBoQhcrE75QfXlO9JYTia3MgNoZWU6iGABQOVACyehgRKxuQKa4O8rILjWraOz5LjFZtrCFlMZojRUBkCT8iUFkiOLrlZyjhQEMnLqLhIXQN5fnSX+OKYyIzBogyBIL20nU//MBHWNxXA4mAWHc7AiRpmyMRkAj4zqypzDAzrQOIBiQLSBhbd1Y6rKMFXXLJU6MGHJT0ooLFLnG1DKAhKuiOpG57wOVEGBMIfvc69ucdtKYIcE7aDXXL15mRG+hpoeJ8vd9QjEPl8MLOUaSIJR4Ab7imRmFLrjTBbu0QE22mJC5ywLttr4R0idTFFBYo3G0BAyvrmgRLErlOgBMyGncHTavcRxfIzhkORCQXkxoiv0iYOwJ+EzFNvfgJD2kYTAZRAYQxGhB5oOZ3WvDxYkibAghmO2/do6ksQNw2TUbjeKKCx2/EkMStwHNkGnizZc5WJnRdT+U0tg+7uAOAfRviEGNRyrrDWrbIrd2okKYyjSNhty5flS1uyq/CoHLQAbTA09T9TUOEW7otN+RLHA+GAScwOlM3XLJK7voSB56wRTriSyqiCfEI8j1prcyAsTm1blG+vMk+enpViJK9bkV5w20VBB60pStqpjBa1LuNydUd0UUV0EHjjSmeK+BvT1p7VU492ws4S8LN23dk6goFIyxOYksIG46+E1lkaW7LhFy2Q4sWH7/vH1EmPDLbQNe6B+hHzr1kc94SDLgAwG111iQfu6axt5wGz9ucAvx38h0kFWkZtpyg6VM8N4javoLlm4txDsymR0/X9KhST4HKLjyhrbBEGDIQKPC0g5QNNI3HTpTnDEkrMyFeTBjVlI1IH9indFMkKKr3bnEOmFLIzKc26kg/A53H96VUOHcSvG0Sb1wnvLgku0wMTfUDfoAPQAcqaVkuVOjUJorOuA8QvNYw5a7cJOGvMSXYkkGxDGTqRJ18z1pljuJ3xhiwvXQfdrTTnaZOHtktM7ySZ6mnpFrNSorNMXxG8Ii9c/3X3252rxPPmQD8hThcfd92w7d7ck3OGAnO0kO1vOCZ1zSZ6zrS0j1Gh0hexDBoCE+ev9KovZ7H3Wu2Q124QdwXYg/b3hrJ6AD0ArQaGqGnY0s4g+FRaKiY5gKPSIivbmKbLmykHXQgzvA+ca/I06rwikMQTEtB8JMAkETDR09eWprj3t/8s/WOnUef5U7ooAbe9NJHdnQxM76xO3TX5VwuMb/KYagc+Z325U8ooAZ++P8A5TbE8+U6bb6D604sXS0ypEHz1+oH9mlKQvX8piOn5kigBeim74iIkc2G/TTpzpa20iTQBxiLOaPIhuu1MrlpMxXOAxaTA9dCZ86c3i0/FA6U1xFvnMf671zZOoa2ijWML5JOlbW1Iil02rrhyZM6ooorUkKrfbTgaXrfe5M721MLyccwQNTGpA9RzqyUVM4qSplQm4StHzZ2lsoEQ2lChiZaPiI1Gp3jbU8xUr7Le1FjAtfN/OO8CAZFzRlLlmYyIGoA351P+1jsEYbG4UNp4rlpZ06uqjlzIHr6UTh+CACSA/eLbuKW8W0FgJ05nbpXMovHGmdrccrtG78A7W4PGErhrwdgMxWGUgbT4gJ3G071N1h3ssxTjiFkRpcW6Hbo0Fip6fCNK3EmrTs5skdLorXtB/2Q/wAX/wCj1TOFWybLQCftbuw/+qv1f7/Be+stavXWYM7OGU6gEEBQWB0EmBy0EmJKWG7NpbtNbtO0EYgZmMmb7Z2jKAIBnlO28VadGDTbsqfZ+wwsYaVYRhb4Oh0M4fT10P0phxGy3upGVpOFsgCDv7tbEes8qvZ4AxQqWUHu1tqwAMZWDDMpWLg0G+kCAFk0tY4GA8sxgOrqQfExVmYFyRqQGC+iDXkHqFpKNjLLaeFv9zyP+VepylhvdcMMrSLnCpEGRDW5+nPpVtwvCDbQTcCMoYBl2XNbCZgDpJZc5nmee5QucHbMGa7baLa2yD4VYI6uVI10IWDqfi26lj0srHZsfbWfX/8AovVpNV/h3Z2zaKP3rM6wSSywTnZydpgu5G/Qb1MYYhVClw0TqWkwTI1Jk6Ea1LdjiqHFFeAzqK9pFBRRRQAUUV4GHXfUUAe03xESJGu89IMDb+I/SnFJvaBM7HaRv6UAIOw/DMEka+ZP6r+Yr1cSBAIIB13n+/8AUUp7uPPYiPI1zcwoI3PXr/e1AHTLmE7H+9KZYq4qA94yqIJ1I2G566Ul2l4g2HsZkBmQshS7Ceijc+Z0GpNZnav+899fuuwS2NAxIuXGIOXMeST93nHTSuTNGLlwdWHG5RuzTOBdocPiS1uy+ZkA3GUsNswB1idDoOXUVYKxD2f8NuHHYZHt3EuIGvltQMgUKADzViQI6NrW3124eDDNFRlsFFFFamQUUUUAFVLtJ2Gs4gTa+ycHMuXQBuo6Tz0g9OdW2iplFSVMqE3F2jFuG8AvYTieGe6hUm5lLqCLb5gU10Kg+LaZrYGWQQdjpTmuSgqFirgvJl1u2hgcCm5EnqSfX9aPcLf4fzP9afd2KO7FGlkWMzhEM6bmTqfP+prn3C3+H8z/AFp93Yo7sUaWFjFcDbH3fzPSP0pRsOpIJGo13PPenXdijuxRpYWMzhEJmNdNZPIz16142DQzpvE6nltT3uxR3Yo0sLEVWBAr2le7FHdijQwsSopXuxR3Yo0MLELiBhB2/s03/wPt/h/M/1p/wB2KO7FGhhYy9yTp+Z/rSlmwq/CImnPdijuxRpYWJUUsEFegU9ArILtVgrl3DOtoEvoQBpOsEa+RNUXDdg8YYlbcaMwd8on8PgVpgc61iipeCMnbNodRKEaRC9m+Be753d+8u3CMzRAUAALbUfhAG51J19JqiitUklSMZScnbCiiimIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA/9k=",
            caption:
              "We're re-releasing our chocolate covered strawberries for the Holiday Season",
            likes: 850,
            comments: 32,
            timestamp: "2024-03-19T09:15:00Z",
          },
        ]),
        outputVariable: {
          name: "instagram_posts",
        },
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "Analyse instagram_output, and identify posts related to new product annoucnements and/or posts that reference packaging",
        outputVariable: {
          name: "profile_analysis",
        },
        output:
          "The following post includes a areference to a new product launch, and a new kind of packaging: Caption - 'We're re-releasing our chocolate covered strawberries for the Holiday Season'(https://m.media-amazon.com/images/I/71n5WjmCrcL.jpg) ",
      },
      {
        id: "block3",
        type: "contact",
        blockNumber: 3,
        to: "your_email@company.com",
        subject: "Instagram Profile watcher",
        body: "{{profile_analysis}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "instagram-google-analysis",
    name: "Instagram Post + Google Image Search Analysis",
    description:
      "Analyzes Instagram posts and performs Google Image Search to find similar products",
    agentDescription:
      "This agent first fetches Instagram posts and then uses Google Image Search to find similar products and analyze market trends.",
    tags: ["instagram", "image-search", "market-analysis"],
    blocks: [
      {
        id: "block1",
        type: "instagramagent",
        blockNumber: 1,
        url: "chobani",
        postCount: 2,
        outputVariable: {
          name: "instagram_posts",
        },
        output: JSON.stringify([
          {
            imageUrl: "https://m.media-amazon.com/images/I/71n5WjmCrcL.jpg",
            caption:
              "New! Chobani Greek Yogurt, now in 100% recyclable packaging",
            likes: 1200,
            comments: 45,
            timestamp: "2024-03-20T15:30:00Z",
          },
          {
            imageUrl:
              "data:image/jpeg;base64,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",
            caption:
              "We're re-releasing our chocolate covered strawberries for the Holiday Season",
            likes: 850,
            comments: 32,
            timestamp: "2024-03-19T09:15:00Z",
          },
        ]),
      },
      {
        id: "block2",
        type: "search",
        blockNumber: 2,
        engine: "image",
        query: "Chobani Packaging",
        prompt:
          "Does the packaging include recylcable materials? Respond only with yes or no. ",
        limit: 3,
        imageResults: [
          {
            url: "https://media-cldnry.s-nbcnews.com/image/upload/newscms/2021_34/1765642/chobani-mc-inline-210825.jpg",
            title:
              "Chobani is moving away from plastic with new paper yogurt cup",
            analysisResult: "Yes",
          },
          {
            url: "https://www.packagingstrategies.com/ext/resources/2017-Postings/New-Packages/Chobani-for-web.png?1512598572",
            title:
              "Chobani launches new packaging design with painted fruit images",
            analysisResult: "No",
          },
          {
            url: "https://img.packworld.com/files/base/pmmi/all/image/2024/01/Chobani_1.65aad757b5dc0.png?auto=format%2Ccompress&q=70&w=400",
            title: "Chobani Pursues 'Living and Breathing' Packaging Graphics",
            analysisResult: "No",
          },
        ],
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "You're a sales analyst, reviewing a prospective customers google image results and instagram content, for mentions of recycleable content. Analyse  {{image_results_analysi}} and {{instagram_posts}}, and summarize the results in a concise emaill. ",
        outputVariable: {
          name: "market_analysis",
        },
        output:
          "According to the Instagram and Google Search results, this brand does mention recyclable materials in their packaging in their branding. While not every post about packaging is about recyclable materials (some include mentions of patterns or branding changes), they do advertise decisions to move to paper cups and make their packages 100% recyclable.",
      },
      {
        id: "block3",
        type: "contact",
        blockNumber: 4,
        to: "your_email@company.com",
        subject: "Instagram Profile watcher",
        body: "{{market_analysis}}",
        output: "✉️ Sent!",
      },
    ],
  },
  {
    id: "instagram-engagement-bot",
    name: "Instagram Engagement Bot",
    description:
      "Automatically identify and engage with relevant Instagram comments",
    agentDescription:
      "Benefit Metrics: Automates Instagram engagement by identifying relevant comments and preparing responses for high-engagement posts.",
    tags: ["Social Media", "Marketing"],
    blocks: [
      {
        id: "block1",
        type: "instagramagent",
        blockNumber: 1,
        url: "UFC",
        postCount: 2,
        output: JSON.stringify([
          {
            imageUrl:
              "https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg",
            caption: "Tune into UFC 400 on ESPN Live!",
            likes: 1200,
            comments: 45,
            timestamp: "2024-03-20T15:30:00Z",
          },
          {
            imageUrl:
              "https://media.video-cdn.espn.com/motion/2024/0601/dm_240601_UFC_Poirier_DVC_Edit_date_with_destiny/dm_240601_UFC_Poirier_DVC_Edit_date_with_destiny.jpg",
            caption: "Catch Dustin fight for the belt on UFC 400",
            likes: 1200,
            comments: 45,
            timestamp: "2024-03-20T15:30:00Z",
          },
        ]),
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "You are a social media manager for a sports promotion, and you have an upcoming event (UFC 400 on June 16th 2025). Review {{instagram_results}}, and identify any comments in the posts that ask questions about the events, or comments that are getting a lot of likes for you to engage with. For each, give me the post id, the username of the poster, the comment and the suggested reply",
        outputVariable: {
          name: "suggested_reply",
        },
        output: `{
          "post_id": "pk72927848",
          "commenter": "mma_fan_2024",
          "comment": "Will there be a live stream option for international fans?",
          "reply": "Yes! UFC 400 will be available worldwide through UFC Fight Pass and our official broadcasting partners. Stay tuned for the full list of streaming options in your region! 🌎 #UFC400"
        }, {
          "post_id": "pk10122",
          "commenter": "sahil_sinha",
          "comment": "casual fans don't undersetand why this is huge 🔥",
          "reply": "No casuals allowed ❌"
        }`,
      },
      {
        id: "block3",
        type: "make",
        blockNumber: 3,
        webhookUrl: "https://hook.make.com/ig-automation",
        output: "Comments were synced using Make Scenario 30482",
        parameters: [
          {
            key: "post_id",
            value: "{{suggested_reply.post_id}}",
          },
          {
            key: "commenter",
            value: "{{suggested_reply.commenter}}",
          },
          {
            key: "reply",
            value: "{{suggested_reply.reply}}",
          },
        ],
      },
    ],
  },
];

// Helper function within the same file
function getShareableAgentById(id: string): ShareableAgent | undefined {
  return SHAREABLE_AGENTS.find((agent) => agent.id === id);
}

// Update the interface to match our new Agent type
interface SharedAgentData extends ShareableAgent {}

export default function SharedAgentPage() {
  const router = useRouter();
  const { agentId } = router.query;

  const [agentData, setAgentData] = useState<SharedAgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runState, setRunState] = useState<RunState>(RunState.NOT_STARTED);
  const [processingBlockIndex, setProcessingBlockIndex] = useState<
    number | null
  >(null);
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);
  const [thinkingEmoji, setThinkingEmoji] = useState("🤔");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  const cycleEmoji = useCallback(() => {
    const emojis = ["🤔", "🧠", "💭"];
    setThinkingEmoji((prev) => {
      const currentIndex = emojis.indexOf(prev);
      return emojis[(currentIndex + 1) % emojis.length];
    });
  }, []);

  const processBlocks = async () => {
    setRunState(RunState.RUNNING);
    setCompletedBlocks([]);

    for (let i = 0; i < agentData!.blocks.length; i++) {
      setProcessingBlockIndex(i);

      // Start emoji cycling
      const emojiInterval = setInterval(cycleEmoji, 500);

      // Wait 3 seconds instead of 5
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Stop emoji cycling and show output
      clearInterval(emojiInterval);
      setCompletedBlocks((prev) => [...prev, i]);

      // If this is the last block, mark as completed and show info dialog after a delay
      if (i === agentData!.blocks.length - 1) {
        setRunState(RunState.COMPLETED);
        setProcessingBlockIndex(null);
        // Wait 3 seconds before showing the info dialog
        setTimeout(() => {
          setShowInfoDialog(true);
        }, 3000);
      }
    }
  };

  const handleRunAgent = () => {
    processBlocks();
  };

  const handleStopAgent = () => {
    setRunState(RunState.COMPLETED);
    // TODO: Implement agent stopping logic
  };

  const handleBack = () => {
    router.push("/agentStore");
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast("Link to agent copied!", {
      action: {
        label: "Close",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const handleGetInTouch = () => {
    window.location.href = "mailto:sahil@lytix.co";
  };

  // Dynamic footer content based on run state
  const renderFooterContent = () => {
    switch (runState) {
      case RunState.NOT_STARTED:
        return (
          <div className="flex justify-end items-center w-full max-w-screen-xl mx-auto px-4">
            <Button
              onClick={handleRunAgent}
              className="bg-blue-600/80 hover:bg-blue-700/90"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              Run ⌘⏎
            </Button>
          </div>
        );
      case RunState.RUNNING:
        return (
          <div className="flex justify-center items-center w-full max-w-screen-xl mx-auto px-4">
            <div className="text-gray-400">Running...</div>
          </div>
        );
      case RunState.COMPLETED:
        return (
          <div className="grid grid-cols-3 gap-4 w-full max-w-screen-xl mx-auto px-4">
            <div className="flex justify-center">
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share agent
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleRunAgent}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                Re-run agent ⌘⏎
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleGetInTouch}
                className="bg-blue-600/80 hover:bg-blue-700/90"
              >
                <Mail className="h-5 w-5 mr-2" />
                Get in touch!
              </Button>
            </div>
          </div>
        );
    }
  };

  const renderBlock = (block: ShareableBlock) => {
    const isProcessing = processingBlockIndex === block.blockNumber - 1;
    const isCompleted = completedBlocks.includes(block.blockNumber - 1);

    const commonProps = {
      blockNumber: block.blockNumber,
      isCompleted,
      output: isCompleted ? block.output : undefined, // Only pass output if block is completed
      outputVariable: block.outputVariable,
      isProcessing,
      thinkingEmoji: isProcessing ? thinkingEmoji : undefined,
    };

    const renderBlockContent = () => {
      switch (block.type) {
        case "agent":
          return (
            <ShareableAgentBlock
              {...commonProps}
              userPrompt={block.userPrompt}
              attachedFile={block.attachedFile}
            />
          );
        case "webagent":
          return (
            <ShareableWebBlock
              {...commonProps}
              url={block.url}
              nickname={block.nickname}
            />
          );
        case "contact":
          return (
            <ShareableContactBlock
              {...commonProps}
              to={block.to}
              subject={block.subject}
              body={block.body}
            />
          );
        case "checkin":
          return <ShareableCheckinBlock {...commonProps} />;
        case "instagramagent":
          return (
            <ShareableInstagramAgent
              {...commonProps}
              url={block.url}
              postCount={block.postCount}
            />
          );
        case "search":
          return (
            <ShareableSearchBlock
              {...commonProps}
              engine={block.engine}
              query={block.query}
              limit={block.limit}
              topic={block.topic}
              section={block.section}
              timeWindow={block.timeWindow}
              prompt={block.prompt}
              trend={block.trend}
              region={block.region}
              imageResults={block.imageResults}
            />
          );
        case "make":
          return (
            <ShareableMakeBlock
              {...commonProps}
              webhookUrl={block.webhookUrl}
              parameters={block.parameters}
            />
          );
        default:
          return null;
      }
    };

    return <div className="relative">{renderBlockContent()}</div>;
  };

  useEffect(() => {
    if (agentId && typeof agentId === "string") {
      setIsLoading(true);
      const agent = getShareableAgentById(agentId);
      if (agent) {
        setAgentData(agent);
      }
      setIsLoading(false);
    }
  }, [agentId]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-400">Loading...</div>
        </div>
      </PublicLayout>
    );
  }

  if (!agentData) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-400">Agent not found</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen flex flex-col bg-[#141414]">
        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
          <div className="max-w-screen-xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-cente<r">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mr-4 text-gray-300 hover:text-white"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-semibold text-white">
                  {agentData?.name}
                </h1>
              </div>

              {/* Info Button with Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 text-gray-300 hover:text-white border-gray-700"
                  >
                    <InformationCircleIcon className="h-5 w-5" />
                    Agent Info
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {agentData?.name}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="text-gray-300 space-y-4">
                    <div>
                      <p
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: agentData?.agentDescription || "",
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-2">
                        Tags
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {agentData?.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div></div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-6">
          <div className="space-y-6">
            <p className="text-gray-400 mb-6">{agentData.description}</p>
            {agentData.blocks.map((block, index) => renderBlock(block))}
          </div>
        </main>

        {/* Sticky Footer */}
        <footer className="sticky bottom-0 z-50 bg-gray-900 border-t border-gray-700 py-4">
          {renderFooterContent()}
        </footer>

        {/* Info Dialog */}
        <Dialog open={showInfoDialog} onOpenChange={setShowInfoDialog}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {agentData?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="text-gray-300 space-y-4">
              <div>
                <p
                  className="text-sm"
                  dangerouslySetInnerHTML={{
                    __html: agentData?.agentDescription || "",
                  }}
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {agentData?.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleGetInTouch}
                className="bg-blue-600/80 hover:bg-blue-700/90"
              >
                <Mail className="h-5 w-5 mr-2" />
                Get in touch!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contact Dialog */}
        <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
          <DialogContent className="bg-gray-900 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Get in Touch</DialogTitle>
            </DialogHeader>
            <div className="text-gray-300 space-y-4">
              <p>
                Have questions about this agent? We'd love to hear from you!
              </p>
              <p>Email us at: sahil@lytix.co</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
                onClick={() => setShowContactDialog(false)}
              >
                <Mail className="h-5 w-5 mr-2" />
                Send Email
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PublicLayout>
  );
}

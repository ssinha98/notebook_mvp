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

// Update the ShareableBlock type
type ShareableBlock =
  | ShareableAgentBlock
  | ShareableContactBlock
  | ShareableWebBlock
  | ShareableCheckinBlock
  | ShareableCodeBlock
  | ShareableMakeBlock
  | ShareableExcelBlock;

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

      // Wait 5 seconds
      await new Promise((resolve) => setTimeout(resolve, 5000));

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

  const renderBlock = (block: ShareableBlock, index: number) => {
    const isProcessing = processingBlockIndex === index;
    const isCompleted = completedBlocks.includes(index);

    const renderOutput = (output: string) => {
      if (block.type === "excel") {
        return (
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            ✅ Excel file generated and downloaded successfully!
            <br />
            <a
              href={output}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all"
            >
              Output.xlsx
            </a>
          </p>
        );
      }

      if (block.type === "code") {
        return (
          <pre className="text-white font-mono text-sm whitespace-pre-wrap">
            {output}
          </pre>
        );
      }

      if (block.type === "make") {
        return (
          <pre className="text-white font-mono text-sm whitespace-pre-wrap">
            {`> Response: 200 ✅\n\n${output}`}
          </pre>
        );
      }

      // Handle other block types
      return (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{output}</p>
      );
    };

    return (
      <div key={block.id} className="space-y-4">
        {/* Original block content */}
        {block.type === "agent" && (
          <ShareableAgentBlock
            blockNumber={block.blockNumber}
            userPrompt={block.userPrompt}
            attachedFile={block.attachedFile}
            outputVariable={block.outputVariable}
          />
        )}
        {block.type === "webagent" && (
          <ShareableWebBlock
            blockNumber={block.blockNumber}
            url={block.url}
            nickname={block.nickname}
            outputVariable={block.outputVariable}
          />
        )}
        {block.type === "contact" && (
          <ShareableContactBlock
            blockNumber={block.blockNumber}
            to={block.to}
            subject={block.subject}
            body={block.body}
          />
        )}
        {block.type === "checkin" && (
          <ShareableCheckinBlock
            blockNumber={block.blockNumber}
            outputVariable={block.outputVariable}
            isProcessing={isProcessing}
            isCompleted={isCompleted}
          />
        )}
        {block.type === "excel" && (
          <ShareableExcelAgent
            blockNumber={block.blockNumber}
            userPrompt={block.userPrompt}
          />
        )}
        {block.type === "code" && (
          <ShareableCodeBlock
            blockNumber={block.blockNumber}
            language={block.language}
            code={block.code}
            output={block.output}
            isCompleted={isCompleted}
          />
        )}
        {block.type === "make" && (
          <ShareableMakeBlock
            blockNumber={block.blockNumber}
            webhookUrl={block.webhookUrl}
            parameters={block.parameters}
            output={block.output}
            isCompleted={isCompleted}
          />
        )}
        {/* Processing/Output section */}
        {(isProcessing || isCompleted) && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            {isProcessing ? (
              <div className="text-2xl text-center animate-pulse">
                {thinkingEmoji}
              </div>
            ) : block.output ? (
              renderOutput(block.output)
            ) : null}
          </div>
        )}
      </div>
    );
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
            {agentData.blocks.map((block, index) => renderBlock(block, index))}
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

import {
  ShareableAgent,
  ShareableBlock,
  ShareableInstagramBlock,
  ShareableDocDiffBlock,
  ShareableDocAnnotatorBlock,
  SimulatedApiBlockType,
  SimulatedEmailBlockType,
  ShareableDataVizBlock,
  ShareableConversingAgentBlock,
} from "@/types/shareable_blocks";

// Add export to the constant declaration
export const SHAREABLE_AGENTS: ShareableAgent[] = [
  {
    id: "event-scheduler",
    name: "Schedule & Coordinate Meetings",
    description: "Automated meeting coordination and calendar management",
    agentDescription:
      "This agent streamlines the complex process of scheduling meetings with large groups by automatically analyzing calendar availability and coordinating with team members. It handles the back-and-forth communication to find optimal meeting times, even for participants without public calendars. Benefit Metrics: Reduces meeting scheduling time by 90%, eliminates scheduling conflicts, and saves ~2-3 hours per week in calendar coordination.",
    tags: ["Admin", "Calendars", "Project Management"],
    start_method: "email",
    blocks: [
      {
        id: "initial_request_block",
        type: "simulatedemail",
        blockNumber: 1,
        from: "susan@usesolar.ai",
        subject: "Meeting Coordination Request",
        body: "help me schedule a meeting with everyone involved in the braze migration project",
        attachments: [],
      },
      {
        id: "participant_identification_block",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "You are a scheduling agent responsible for coordinating events between multiple parties.\n\t1.\tCheck each participant's availability via their Outlook calendar (if accessible).\n\t2.\tFor participants not on Outlook, send a quick email requesting their next available time slots.\n\t3.\tPropose a few meeting time options that work for everyone and email the group to confirm.\n\t4.\tTrack RSVPs and follow up with anyone who hasn't responded.\n\t5.\tOnce confirmed, send a final calendar invite to all participants and notify me when done.\n\nKeep your tone professional and efficient. The goal is to schedule as quickly and smoothly as possible.\n\nFirst, give me a list of people who should be in the meeting",
        outputVariable: {
          name: "participants",
          value:
            "Product Team\n\t•\tJordan Lee – Product Manager (Messaging & Growth)\n\t•\tRina Patel – UX Designer\n\nEngineering Team\n\t•\tMarcus Chen – Backend Engineer\n\t•\tDiana Gomez – Frontend Engineer\n\t•\tKevin Zhou – DevOps / Infrastructure\n\nData & Analytics Team\n\t•\tPriya Nair – Data Analyst\n\t•\tSamuel Reed – Data Engineer\n\nMarketing Team\n\t•\tTaylor Brooks – Lifecycle Marketing Manager\n\t•\tAlex Nguyen – Marketing Operations\n\nProject Management / Operations\n\t•\tNina Alvarez – Program Manager\n\t•\tAndrew Lim – Chief of Staff",
        },
        output:
          "Product Team\n\t•\tJordan Lee – Product Manager (Messaging & Growth)\n\t•\tRina Patel – UX Designer\n\nEngineering Team\n\t•\tMarcus Chen – Backend Engineer\n\t•\tDiana Gomez – Frontend Engineer\n\t•\tKevin Zhou – DevOps / Infrastructure\n\nData & Analytics Team\n\t•\tPriya Nair – Data Analyst\n\t•\tSamuel Reed – Data Engineer\n\nMarketing Team\n\t•\tTaylor Brooks – Lifecycle Marketing Manager\n\t•\tAlex Nguyen – Marketing Operations\n\nProject Management / Operations\n\t•\tNina Alvarez – Program Manager\n\t•\tAndrew Lim – Chief of Staff",
      },
      {
        id: "calendar_check_block",
        type: "codeblock",
        blockNumber: 3,
        language: "python",
        code: 'import requests\nimport datetime\nfrom msal import ConfidentialClientApplication\n\n# Azure AD app credentials (replace with your actual values)\nCLIENT_ID = \'your-client-id\'\nCLIENT_SECRET = \'your-client-secret\'\nTENANT_ID = \'your-tenant-id\'\n\n# Get access token from Microsoft Identity platform\nauthority = f"https://login.microsoftonline.com/{TENANT_ID}"\napp = ConfidentialClientApplication(\n    CLIENT_ID,\n    authority=authority,\n    client_credential=CLIENT_SECRET\n)\ntoken_response = app.acquire_token_for_client(scopes=["https://graph.microsoft.com/.default"])\naccess_token = token_response["access_token"]\n\n# Team members\nteam_members = [\n    {"name": "Jordan Lee", "email": "jordan@company.com"},\n    {"name": "Rina Patel", "email": "rina@company.com"},\n    {"name": "Marcus Chen", "email": "marcus@company.com"},\n    {"name": "Diana Gomez", "email": "diana@company.com"},\n    {"name": "Kevin Zhou", "email": "kevin@company.com"},\n    {"name": "Priya Nair", "email": "priya@company.com"},\n    {"name": "Samuel Reed", "email": "samuel@company.com"},\n    {"name": "Taylor Brooks", "email": "taylor@company.com"},\n    {"name": "Alex Nguyen", "email": "alex@company.com"},\n    {"name": "Nina Alvarez", "email": "nina@company.com"},\n    {"name": "Andrew Lim", "email": "andrew@company.com"},\n]\n\n# Define time window to check for availability\nstart_time = datetime.datetime.utcnow().replace(hour=9, minute=0, second=0, microsecond=0).isoformat() + "Z"\nend_time = datetime.datetime.utcnow().replace(hour=18, minute=0, second=0, microsecond=0).isoformat() + "Z"\n\n# Query each team member\'s calendar\nfor member in team_members:\n    url = "https://graph.microsoft.com/v1.0/me/calendar/getSchedule"\n    headers = {\n        "Authorization": f"Bearer {access_token}",\n        "Content-Type": "application/json"\n    }\n    body = {\n        "schedules": [member["email"]],\n        "startTime": {\n            "dateTime": start_time,\n            "timeZone": "UTC"\n        },\n        "endTime": {\n            "dateTime": end_time,\n            "timeZone": "UTC"\n        },\n        "availabilityViewInterval": 30\n    }\n\n    response = requests.post(url, headers=headers, json=body)\n    \n    if response.ok:\n        availability = response.json()["value"][0]["availabilityView"]\n        print(f"Availability for {member[\'name\']} ({member[\'email\']}): {availability}")\n    else:\n        print(f"Failed to fetch availability for {member[\'name\']}: {response.status_code} – {response.text}")',
        outputVariable: {
          name: "response",
          value:
            '{"participants":[{"name":"Jordan Lee","email":"jordan@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Rina Patel","email":"rina@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Marcus Chen","email":"marcus@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Diana Gomez","email":"diana@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Kevin Zhou","email":"kevin@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Priya Nair","email":"priya@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Samuel Reed","email":"samuel@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Taylor Brooks","email":"taylor@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Alex Nguyen","email":"alex@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Nina Alvarez","email":"nina@company.com","available_slots":null,"status":"calendar_unavailable"},{"name":"Andrew Lim","email":"andrew@company.com","available_slots":null,"status":"calendar_unavailable"}],"common_available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]}',
        },
        output:
          '{"participants":[{"name":"Jordan Lee","email":"jordan@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Rina Patel","email":"rina@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Marcus Chen","email":"marcus@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Diana Gomez","email":"diana@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Kevin Zhou","email":"kevin@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Priya Nair","email":"priya@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Samuel Reed","email":"samuel@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Taylor Brooks","email":"taylor@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Alex Nguyen","email":"alex@company.com","available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]},{"name":"Nina Alvarez","email":"nina@company.com","available_slots":null,"status":"calendar_unavailable"},{"name":"Andrew Lim","email":"andrew@company.com","available_slots":null,"status":"calendar_unavailable"}],"common_available_slots":["2025-04-24T14:00:00Z","2025-04-24T14:30:00Z","2025-04-24T15:00:00Z"]}',
      },
      {
        id: "missing_data_analysis_block",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "{[response}} epresents the response of a code request for getting outlook data. some responses will be time that that person is available. and for some, it will be 'no data' showing that they are not on outlook. Tell me who we didn't find times for.",
        outputVariable: {
          name: "missing_outlook_events_raw",
          value:
            'People we didn\'t find availability for:\n\t•\tNina Alvarez – Program Manager\n\t•\tAndrew Lim – Chief of Staff\n\nThese individuals returned "available_slots": null with "status": "calendar_unavailable", indicating no data was available from Outlook — likely because they are not on the platform.',
        },
        output:
          'People we didn\'t find availability for:\n\t•\tNina Alvarez – Program Manager\n\t•\tAndrew Lim – Chief of Staff\n\nThese individuals returned "available_slots": null with "status": "calendar_unavailable", indicating no data was available from Outlook — likely because they are not on the platform.',
      },
      {
        id: "missing_data_json_block",
        type: "agent",
        blockNumber: 5,
        userPrompt:
          "{{missing_outlook_events_raw}} are people that didn't have outlook data. give me their name and their email. respond in JSON.",
        outputVariable: {
          name: "missing_outlook_events",
          value:
            '[\n  {\n    "name": "Nina Alvarez",\n    "email": "nina@company.com"\n  },\n  {\n    "name": "Andrew Lim",\n    "email": "andrew@company.com"\n  }\n]',
        },
        output:
          '[\n  {\n    "name": "Nina Alvarez",\n    "email": "nina@company.com"\n  },\n  {\n    "name": "Andrew Lim",\n    "email": "andrew@company.com"\n  }\n]',
      },
      {
        id: "draft_emails_block",
        type: "agent",
        blockNumber: 6,
        userPrompt:
          "draft a response to {{missing_outlook_events}}, asking if any of the slots in {{response}} would work",
        outputVariable: {
          name: "draft_emails",
          value:
            "Subject: Quick Check on Your Availability\n\nHi Nina,\n\nWe're coordinating schedules for the group and wanted to see if any of the following times work for you:\n\t•\tThursday, April 24 at 2:00 PM UTC\n\t•\tThursday, April 24 at 2:30 PM UTC\n\t•\tThursday, April 24 at 3:00 PM UTC\n\nLet me know what works best for you, and we'll lock in a time!\n\nThanks,\n[Your Name]\n\nHi Andrew,\n\nWe're working on scheduling a team session and are looking at the following time slots:\n\t•\tThursday, April 24 at 2:00 PM UTC\n\t•\tThursday, April 24 at 2:30 PM UTC\n\t•\tThursday, April 24 at 3:00 PM UTC\n\nCould you let me know if any of these work for you?\n\nAppreciate it!",
        },
        output:
          "Subject: Quick Check on Your Availability\n\nHi Nina,\n\nWe're coordinating schedules for the group and wanted to see if any of the following times work for you:\n\t•\tThursday, April 24 at 2:00 PM UTC\n\t•\tThursday, April 24 at 2:30 PM UTC\n\t•\tThursday, April 24 at 3:00 PM UTC\n\nLet me know what works best for you, and we'll lock in a time!\n\nThanks,\n[Your Name]\n\nHi Andrew,\n\nWe're working on scheduling a team session and are looking at the following time slots:\n\t•\tThursday, April 24 at 2:00 PM UTC\n\t•\tThursday, April 24 at 2:30 PM UTC\n\t•\tThursday, April 24 at 3:00 PM UTC\n\nCould you let me know if any of these work for you?\n\nAppreciate it!",
      },
      {
        id: "nina_email_block",
        type: "contact",
        blockNumber: 7,
        to: "nina@company.com",
        subject: "Quick Check on Your Availability",
        body: "{{draft_emails}}[1]",
        outputVariable: {
          name: "nina_email_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "andrew_email_block",
        type: "contact",
        blockNumber: 8,
        to: "andrew@company.com",
        subject: "Quick Check on Your Availability",
        body: "{{draft_emails}}[2]",
        outputVariable: {
          name: "andrew_email_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "nina_response_block",
        type: "simulatedemail",
        blockNumber: 9,
        from: "nina@usesolari.ai",
        subject: "Re: Quick Check on Your Availability",
        body: "Hi!\n\nThanks for checking in — all of those times work for me. Feel free to book whichever slot works best for the group.\n\nBest,\nNina",
        attachments: [],
      },
      {
        id: "andrew_response_block",
        type: "simulatedemail",
        blockNumber: 10,
        from: "andrew@usesolari.ai",
        subject: "Re: Quick Check on Your Availability",
        body: "Hi!\n\nThanks for reaching out. I'm only available for the 3:00 PM UTC slot on April 24 — the earlier times don't work for me due to other commitments.\n\nLet me know if that ends up being the time.\n\nBest,\nAndrew",
        attachments: [],
      },
      {
        id: "calendar_update_block",
        type: "make",
        blockNumber: 11,
        webhookUrl: "https://hook.make.com/calendar-automation",
        parameters: [
          {
            key: "event_time",
            value: "2025-04-24T15:00:00Z",
          },
          {
            key: "participants",
            value: "{{participants}}",
          },
          {
            key: "project",
            value: "Braze Migration",
          },
        ],
      },
      {
        id: "final_confirmation_block",
        type: "contact",
        blockNumber: 12,
        to: "migration-project@usesolar.ai",
        subject: "Finalized Meeting Time – Braze Migration Project",
        body: "Hi all,\n\nI'm reaching out on behalf of Susan to confirm the meeting time for the Braze migration project.\n\nAfter reviewing everyone's availability, the following time worked best for the group. I've added the event to your calendars and updated our project management docs and dashboards accordingly.\n\nIf anything changes or you need to reschedule, feel free to reach out to robnots@usesolari.ai.\n\nThanks, and talk soon!\n\nBest,\nYour Scheduling Agent",
        outputVariable: {
          name: "final_confirmation_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
    ],
  },
  {
    id: "candidate-qualifier",
    name: "Qualify Prospective Hiring Candidates",
    description: "Automated preliminary candidate screening via email",
    agentDescription:
      "This agent conducts initial candidate screening through email conversations, qualifying candidates before involving the hiring team. Benefit Metrics: Saves ~3-4 hours per candidate by automating initial screening and reduces hiring team involvement with unqualified candidates.",
    tags: ["HR", "Project Management"],
    start_method: "email",
    blocks: [
      {
        id: "initial_email_block",
        type: "simulatedemail",
        blockNumber: 1,
        from: "rstevens25@cmc.edu",
        subject: "Inquiry About the Data Analyst Position",
        body: `Dear Solari hiring team - 
  
  I hope you're well. I came across the Data Analyst position at your company and was excited by the opportunity to apply my skills in a more technical, data-focused role.
  
  My background is in English, but over the past two years, I've worked in data-heavy roles where I've developed strong proficiency in SQL and Python. I've grown passionate about uncovering insights through data and would love to continue building on this foundation in a more structured analytics environment.
  
  Could you share more about the day-to-day work for this role, and how candidates from non-traditional academic backgrounds might fit in?
  
  Thank you for your time—I look forward to hearing from you.`,
        attachments: [],
      },
      {
        id: "candidate_analysis_block",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "you are responsible for screening job candidates. @source is the job description. review the email and attachment (if present), and analyse if someone on the team should interview this person. For each assessment, identify 1) any red flags (i.e. skills we need that aren't present, if years of work or education experience are below what we're looking for). Respond in the following format: \nRed flags: (any red flags)\nThings we are looking for: (skills, experience or traits in the job description that we're looking for)\nadditional questions: (any questions you have that weren't answered).",
        attachedFile: {
          name: "source",
          type: "PDF",
          // replace with Job description
          url: "https://docs.google.com/document/d/1pBly1mjCAqa2Se7uA4TmEivR1fK4A-bwc06q2AwBXgQ/edit?usp=sharing",
          content: "@source",
        },
        outputVariable: {
          name: "analysis",
          value: "",
        },
        output:
          "Red flags:\n\t•\tThe candidate has 2 years of experience, while the role requires a minimum of 3 years.\n\t•\tTheir academic background is in English, whereas the role prefers a degree in Statistics, Mathematics, Economics, Computer Science, or a related field.\n\nThings we are looking for:\n\t•\tDemonstrates strong interest and initiative in transitioning into data analysis from a non-traditional background.\n\t•\tSelf-reported proficiency in SQL and Python, which are core requirements for the role.\n\t•\tHas relevant work experience in data-heavy roles, indicating practical exposure to the field.\n\t•\tStrong communication skills, as evidenced by a clear and thoughtful email.\n\nAdditional questions:\n\t•\tCan the candidate provide examples or a portfolio of projects that showcase their SQL and Python skills?\n\t•\tWhat specific tools (e.g., Excel, Tableau, pandas) and datasets has the candidate worked with in previous roles?\n\t•\tDoes the candidate have any formal training or certifications in data analysis or programming?",
      },
      {
        id: "email_draft_block",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "take {analysis}. create an email that asks the candidate questions in {additional questions}",
        outputVariable: {
          name: "email_draft",
          value: "",
        },
        output:
          "Hi [Candidate's Name],\n\nThanks for reaching out and for your interest in the Data Analyst position—we appreciate you taking the time to share your background.\n\nTo help us better understand your experience and fit for the role, would you mind answering a few quick questions?\n\t1.\tDo you have a portfolio or any examples of projects that highlight your skills in SQL and Python?\n\t2.\tWhat specific tools or technologies (e.g., Excel, Tableau, pandas) have you worked with in your past roles?\n\t3.\tHave you completed any formal training or certifications in data analysis or programming?\n\nLooking forward to your reply!\n\nBest,\n[Your Name]\n[Your Title / Team Name]\n[Company Name]",
      },
      {
        id: "email_response_block",
        type: "contact",
        blockNumber: 4,
        to: "rstevens25@cmc.edu",
        subject: "Quick Follow-Up on Your Data Analyst Application",
        body: "{{email_draft}}",
        outputVariable: {
          name: "email_sent",
          value: "",
        },
        output: "📨 email sent!",
      },
      {
        id: "candidate_response_block",
        type: "simulatedemail",
        blockNumber: 5,
        from: "rstevens25@cmc.edu",
        subject: "Re: Data Analyst Position - Additional Information",
        body: "Hi [Your Name],\n\nThanks for getting back to me—happy to share more details.\n\nI've worked on several personal projects using SQL and Python (with pandas), though I haven't published them online yet. They're saved locally, but I'd be happy to walk through them or share the code directly if that's helpful.\n\nIn my previous roles, I haven't used tools like Excel, Tableau, or pandas professionally. That said, I've been actively building my technical skills through Codecademy's certification programs for both SQL and Python, including work with pandas.\n\nPlease let me know if there's anything else I can share!\n\nBest,\n[Candidate's Full Name]\n[Contact Info]",
        attachments: [],
      },
      {
        id: "final_response_block",
        type: "contact",
        blockNumber: 6,
        to: "{{candidate_email}}",
        subject: "Re: Data Analyst Position - Next Steps",
        body: "Hi [Candidate's Name],\n\nThanks so much for following up and sharing those details. We appreciate the time you took to walk us through your experience and background.\n\nWe have everything we need for now, and someone from the team will be in touch within the next few days with next steps.\n\nThanks again for your interest in the role!\n\nBest,\n[Your Name]\n[Your Title / Team Name]\n[Company Name]",
        outputVariable: {
          name: "final_email_sent",
          value: "",
        },
        output: "📨 email sent!",
      },
      {
        id: "final_analysis_block",
        type: "agent",
        blockNumber: 7,
        userPrompt:
          "analyse the email thread, and give me an update analysis of this candidate.",
        outputVariable: {
          name: "final_analysis",
          value: "",
        },
        output:
          "Red flags:\n\t•\tThe candidate does not have professional experience with key tools like Excel, Tableau, or pandas, which are commonly used in data analyst roles.\n\t•\tProjects are not hosted or publicly available, making it harder to independently assess the quality of their work.\n\nThings we are looking for:\n\t•\tDemonstrates initiative and self-learning through completion of Codecademy certifications in SQL and Python (including pandas).\n\t•\tHas built personal projects using relevant tools, indicating practical familiarity even without professional application.\n\t•\tResponsive, communicative, and open to sharing their work in a 1:1 setting, which shows good collaboration potential.\n\nAdditional questions/comments:\n\t•\tIf the candidate advances, we may want to include a short technical assessment to evaluate practical skills.\n\t•\tWould benefit from mentorship or a team environment where they can build professional experience with standard analytics tools.",
      },
      {
        id: "update_project_board",
        type: "make",
        blockNumber: 8,
        webhookUrl: "https://hook.make.com/hiring-board-automation",
        parameters: [
          {
            key: "candidate_name",
            value: "{{candidate_name}}",
          },
          {
            key: "position",
            value: "Data Analyst",
          },
          {
            key: "status",
            value: "Initial Screening Complete",
          },
          {
            key: "final_analysis",
            value: "{{final_analysis}}",
          },
          {
            key: "next_steps",
            value: "Technical Assessment Required",
          },
          {
            key: "screening_date",
            value: "{{current_date}}",
          },
        ],
        outputVariable: {
          name: "project_board_update",
          value: "",
        },
      },
      {
        id: "team_notification_block",
        type: "contact",
        blockNumber: 9,
        to: "data@yourco.in",
        subject: "Hiring Update",
        body: "Hey team!\n\nThis candidate has passed our preliminary screening. You can find their notes below:\n\t•\tStrengths: Codecademy-certified in SQL and Python (with pandas), built personal projects, proactive and communicative.\n\t•\tGaps: No professional experience with Tableau/Excel; projects not hosted online but available to review.\n\t•\tNote: A quick technical screen might help validate skills further.\n\nWe've updated the hiring project board on Airtable with these details. Please schedule an interview at your earliest convenience.\n\nThanks!\n[Your Name]",
        outputVariable: {
          name: "team_notification_sent",
          value: "",
        },
        output: "📨 email sent!",
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
        type: "excelagent",
        blockNumber: 3,
        userPrompt:
          "Make a spreadsheet showing the analysis of sales data - make the font calibri everywhere. Make a table with {{sales_data_summary}} - bold the headers. Also make a bar chart, with {{written_summary}} as the label.",
        output:
          "https://docs.google.com/spreadsheets/d/1Tcavez45sR1cyE-F4iH1STz0yQJeRpqD/edit?usp=sharing&ouid=101486709579123358134&rtpof=true&sd=true",
      },
    ],
  },
  {
    id: "powerpoint-agent",
    name: "Data to Powerpoint + Data Visualization Agent",
    description:
      "Turn raw data into insights, a formatted presentation that matches a template, and even complex data visualizations",
    agentDescription:
      "Benefit Metrics: saves ~2-3 hours per presentation by automating slide creation and formatting. This agent helps create professional presentations quickly.",
    tags: ["Data Analysis", "Marketing"],
    start_method: "schedule",
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@sales.csv represents raw sales data from our last 1 month of sales. Give me the average dollars and units sold per product, and per region.",
        attachedFile: {
          name: "april_sales.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1IzrBjZfEZqV5ol55BfDpdAQZo-ZP2hzZ/view?usp=sharing",
          content: "Raw sales data for April 2025",
        },
        outputVariable: {
          name: "analysis",
        },
        output: `Model Response:
  Group,Avg Units Sold,Avg Dollars Sold
  Product: Headphones,36.375,5456.25
  Product: Keyboard,63.857143,6385.714286
  Product: Laptop,42.25,42250.0
  Product: Monitor,46.857143,14057.142857
  Product: Mouse,47.0,2350.0
  Product: Smartphone,55.625,44550.0
  Product: Tablet,55.9,30000.0
  City: Chicago,32.0,15400.0
  City: Houston,46.25,6806.25
  City: Los Angeles,58.4,23690.0
  City: New York,61.2,33400.0
  City: Philadelphia,46.375,24087.5
  City: Phoenix,36.6,20510.0
  City: San Antonio,50.625,35775.0
  `,
      },
      {
        id: "viz1",
        type: "dataviz",
        blockNumber: 2,
        chosenChart: "smart",
        source: "{{analysis}}",
        context: "Describe the units sold per state",
        // pointers: "Please highlight the top performing category in red",
        output:
          "Response 200: 📈\ndata visualization created! Find the image at this link: https://drive.google.com/file/d/1XvdMrgtK9NOjHbRXmWc9TuM3i4jNRN90/view?usp=sharing \n(Chosen chart: simple map chart. Reasoning: The data is cleanly organized by city, and a map chart is a good way to visualize this.)",
      },
      {
        id: "block3",
        type: "agent",
        // output: `https://www.usesolari.ai/`,
        blockNumber: 3,
        userPrompt:
          "take {{analysis}}, and create 2-3 sentence summaries, summarizing each point. these will go in a powerpoint presnting the data, alongside a chart. speak in a professional and concise manner.",
        // slides: 3,
        outputVariable: {
          name: "analysis_summary",
        },
        output: `
  Per Product Insights
      •	Smartphones had the highest average dollar value per sale at $44,550, with an average of 55 units sold per entry — making it your top high-ticket item.
      •	Laptops followed closely with $42,250 average revenue, though with fewer units sold (42 avg) — indicating fewer but larger transactions.
      •	Monitors and Tablets had solid performance too, averaging $14,057 and $30,000 respectively.
      •	Headphones, Keyboards, and Mice had much lower revenue per transaction (around $2K–$6K), suggesting they're lower-cost, higher-volume items.
  Per City Insights
      •	New York leads in both units sold (61.2 avg) and revenue per entry ($33,400), indicating it's your strongest performing region.
      •	San Antonio and Los Angeles also perform well, averaging over $23K–$35K in sales.
      •	Philadelphia shows moderate volume but strong revenue, suggesting balanced performance.
      •	Phoenix and Chicago trail in both units and revenue, potentially signaling underperforming regions or opportunities for growth.
            `,
      },
      {
        id: "block4",
        type: "agent",
        blockNumber: 4,
        userPrompt:
          "@template.pptx is an example of how we format our presentations. Please analyse the template, and extract all the instructions you would need to create a similar presentation. Include the colours, fonts, different page templates etc... ",
        attachedFile: {
          name: "template.pptx",
          type: "pptx",
          url: "https://drive.google.com/file/d/1L8-goD0L-okVxsrZe5NvOKXUmOVl_Wse_HBQlRTBlf8/view?usp=sharing",
          content: "Template for sales presentation",
        },
        outputVariable: {
          name: "design_guidelines",
        },
        output: `
Colors (Hex Codes):
	•	Primary (Accent): #E2632C
	•	Background: #FFFFFF
	•	Text/Divider: #00000
Fonts:
	•	Title font: Raleway (bold)
	•	Body font: Lato (regular)

Slide Types & Format Rules:
	1.	Title Slide
	•	Background color: #E2632C
	•	Title:
	•	Centered vertically and horizontally
	•	Font: Lato
	•	Size: 42–52 pt (adjust based on title length)
	•	Weight: Bold
	•	Color: White
	•	Subheading:
	•	Placed below the title
	•	Format: “Presenter Name – Date”
	•	Font: Lato, white
	•	Divider lines:
	•	One above the title box and one below the subheading box
	•	Color: White
	•	Thickness: 2–3 pt

	2.	Main Point Delivery Slide
	•	Layout: Split background
	•	Left half: White
	•	Right half: #E2632C
	•	Title:
	•	Centered on the left (white) side
	•	Font: Raleway
	•	Size: 32–42 pt
	•	Weight: Bold
	•	Color: #E2632C
	•	Subpoints:
	•	On the right (orange) side
	•	Font: Lato
	•	Size: 18–22 pt
	•	Weight: Regular
	•	Color: White
	•	Bulleted list

	3.	Visual Slide
	•	Title:
	•	Font: Raleway
	•	Size: 36 pt
	•	Color: #E2632C
	•	Layout:
	•	Left side: Bullet points
	•	Font: Lato
	•	Size: 12–18 pt (adjust for text length)
	•	Color: Black
	•	Right side: Visual (image or chart)
	•	Divider lines:
	•	One above the title
	•	One below the content area (visual and bullets)
	•	Color: Black
	•	Thickness: 5 pt

When generating slides, structure them as dictionaries or objects where each slide has a type, content, layout, and style section for easy conversion to code or rendering.
        `,
      },
      {
        id: "block4",
        type: "powerpoint",
        blockNumber: 5,
        prompt:
          "create a 3-slide presentation about the sales data. Include {{analysis_summary}} in the first slide, and {{data_viz}} in the second slide. Use {{design_guidelines}} as a guideline for creating the powerpoints. ",
        slides: 3,
        output:
          "https://docs.google.com/presentation/d/15D9YXFuiL2yEqkq4NdmAKR9WtCtpBA0Gg8rQbHxZ6YM/edit?usp=sharing",
      },
    ],
  },

  {
    id: "weather-api-agent",
    name: "Weather API Agent",
    start_method: "api",
    description: "Get real-time weather information for any city",
    agentDescription:
      "Benefit Metrics: saves time by automatically fetching and formatting weather data from any city in the world.",
    tags: ["Data", "API"],
    blocks: [
      {
        id: "block1",
        type: "simulatedapi",
        blockNumber: 1,
        endpoint: "https://api.example.com/weather",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: "What's the weather in Auckland right now?",
          uuid: "303402",
        }),
        outputVariable: {
          name: "weather_response",
        },
        // output: "Simulated API response for weather in Auckland",
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "{{weather_response}} is a question a user has asked via an API, about the weather in a given city. Only respond with the city name.",
        outputVariable: {
          name: "city",
        },
        output: "Auckland, New Zealand",
      },
      {
        id: "block3",
        type: "codeblock",
        blockNumber: 3,
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
    id: "thought-leadership",
    name: "Thought Leadership Blog Post",
    description:
      "Generate a thought leadership blog post by analyzing research and event data",
    agentDescription:
      "Benefit Metrics: saves ~2 hours per blog post (<a href='https://blog.hubspot.com/marketing/blogging-time-benchmark' target='_blank' rel='noopener noreferrer' className='text-blue-400 hover:text-blue-300 underline hover:underline-offset-4 transition-all'>source</a>)",
    tags: ["Content", "Marketing"],
    tools: ["agent", "email"],
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
  - 65% of surveyed professionals believe that Al enables them to focus more on high-value tasks, thereby improving job satisfaction.
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
    tools: ["agent", "web", "contact"],
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
    tools: ["agent", "web", "contact"],
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
    tools: ["agent", "web"],
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
    tools: ["agent", "contact"],
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
    tools: ["agent", "contact"],
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
    tools: ["agent", "contact"],
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
    tools: ["agent", "contact"],
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
    tools: ["agent", "check in", "web", ""],
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
          type: "pptx",
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
    id: "instagram-profile-watcher",
    name: "Instagram Profile Watcher",
    description: "Monitor and analyze Instagram profiles for insights",
    agentDescription:
      "Benefit Metrics: Automatically track Instagram profile changes and analyze engagement patterns, saving hours of manual monitoring.",
    tags: ["Social Media", "Data Analysis"],
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
              "data:image/jpeg;base64,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",
            caption:
              "New! Chobani Greek Yogurt, now in 100% recyclable packaging",
            likes: 1200,
            comments: 45,
            timestamp: "2024-03-20T15:30:00Z",
          },
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
        attachedFile: {
          name: "instagram_results.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1SWvBJxN7VQy-JPly6vAmxQ0blXUhFFto/view?usp=sharing",
          content: "Instagram results...",
        },
        outputVariable: {
          name: "instagram_results",
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
            value: "{{instagram_results.post_id}}",
          },
          {
            key: "commenter",
            value: "{{instagram_results.commenter}}",
          },
          {
            key: "reply",
            value: "{{instagram_results.reply}}",
          },
        ],
      },
    ],
  },
  {
    id: "data-viz-excel-agent",
    name: "Data to Spreadsheet + Data Viz Agent",
    description: "Create professional Excel spreadsheets with AI assistance",
    agentDescription:
      "Benefit Metrics: saves ~2-3 hours per presentation by automating spreadsheet creation and formatting. This agent helps create professional spreadsheets quickly.",
    tags: ["Content", "Marketing", "Data Analysis"],
    blocks: [
      {
        id: "block1",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "@sales.csv represents raw sales data from our last 1 month of sales. Give me the average dollars and units sold per product, and per region.",
        attachedFile: {
          name: "april_sales.csv",
          type: "csv",
          url: "https://drive.google.com/file/d/1IzrBjZfEZqV5ol55BfDpdAQZo-ZP2hzZ/view?usp=sharing",
          content: "Raw sales data for April 2025",
        },
        outputVariable: {
          name: "analysis",
        },
        output: `Model Response:
  Group,Avg Units Sold,Avg Dollars Sold
  Product: Headphones,36.375,5456.25
  Product: Keyboard,63.857143,6385.714286
  Product: Laptop,42.25,42250.0
  Product: Monitor,46.857143,14057.142857
  Product: Mouse,47.0,2350.0
  Product: Smartphone,55.625,44550.0
  Product: Tablet,55.9,30000.0
  City: Chicago,32.0,15400.0
  City: Houston,46.25,6806.25
  City: Los Angeles,58.4,23690.0
  City: New York,61.2,33400.0
  City: Philadelphia,46.375,24087.5
  City: Phoenix,36.6,20510.0
  City: San Antonio,50.625,35775.0
  `,
      },
      {
        id: "block2",
        type: "codeblock",
        blockNumber: 2,
        language: "python",
        code: `
  import pandas as pd
  import geopandas as gpd
  import matplotlib.pyplot as plt
  import requests
  from io import BytesIO
  
  # Step 1: Load CSV
  df = pd.read_csv("sales_data_demo.csv")
  
  # Step 2: Map cities to states
  city_to_state = {
      'New York': 'New York',
      'Houston': 'Texas',
      'San Antonio': 'Texas',
      'Phoenix': 'Arizona',
      'Philadelphia': 'Pennsylvania'
  }
  df['State'] = df['City'].map(city_to_state)
  
  # Step 3: Group by state
  units_per_state = df.groupby('State')['Units Sold'].sum().reset_index()
  
  # Step 4: Load US states geometry
  geojson_url = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json"
  response = requests.get(geojson_url)
  states = gpd.read_file(BytesIO(response.content))
  
  # Step 5: Merge sales data into map
  choropleth_data = states.merge(units_per_state, how='left', left_on='name', right_on='State')
  choropleth_data['Units Sold'] = choropleth_data['Units Sold'].fillna(0)
  
  # Step 6: Plot
  fig, ax = plt.subplots(figsize=(15, 10))
  choropleth_data.plot(column='Units Sold', ax=ax, cmap='Blues', edgecolor='black', legend=True)
  ax.set_title("Units Sold by State", fontsize=18)
  ax.axis("off")
  
  plt.tight_layout()
  plt.savefig("units_sold_map.png")
  plt.show()
  `,
        outputVariable: {
          name: "data_viz",
        },
        output:
          "✅ code run successfully! Find the image at this link: https://drive.google.com/file/d/1XvdMrgtK9NOjHbRXmWc9TuM3i4jNRN90/view?usp=sharing",
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "take {{analysis}}, and create 2-3 sentence summaries, summarizing each point. these will go in a spreadsheet presnting the data, alongside a chart. speak in a professional and concise manner.",
        // slides: 3,
        outputVariable: {
          name: "analysis_summary",
        },
        output: `
  Per Product Insights
      •	Smartphones had the highest average dollar value per sale at $44,550, with an average of 55 units sold per entry — making it your top high-ticket item.
      •	Laptops followed closely with $42,250 average revenue, though with fewer units sold (42 avg) — indicating fewer but larger transactions.
      •	Monitors and Tablets had solid performance too, averaging $14,057 and $30,000 respectively.
      •	Headphones, Keyboards, and Mice had much lower revenue per transaction (around $2K–$6K), suggesting they're lower-cost, higher-volume items.
  Per City Insights
      •	New York leads in both units sold (61.2 avg) and revenue per entry ($33,400), indicating it's your strongest performing region.
      •	San Antonio and Los Angeles also perform well, averaging over $23K–$35K in sales.
      •	Philadelphia shows moderate volume but strong revenue, suggesting balanced performance.
      •	Phoenix and Chicago trail in both units and revenue, potentially signaling underperforming regions or opportunities for growth.
            `,
      },
      {
        id: "block4",
        type: "excelagent",
        blockNumber: 4,
        userPrompt:
          "Make a table with the sales and product data with bolded headers. Also make a bar chart showing both tables, include {{analysis_summary}} as the caption to both tables. Also include {{data_viz}} as the chart.",
        // slides: 3,
        output:
          "https://docs.google.com/spreadsheets/d/1MnY_36sqFLThKmOQFfp1Czb0FV74MB9cuCVFnYH6VKk/edit?usp=sharing",
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
    tags: ["instagram", "image search", "sales"],
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
              "New! Chobani Greek Yogurt, now in 100% recyclable packaging",
            likes: 1200,
            comments: 45,
            timestamp: "2024-03-20T15:30:00Z",
          },
        ]),
      },
      {
        id: "block2",
        type: "searchagent",
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
        // slides: 3,
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
  // {
  //   id: "doc-diff-agent",
  //   name: "Document Diff Agent",
  //   description: "Compare and analyze differences between two documents",
  //   agentDescription:
  //     "Benefit Metrics: saves time by automatically highlighting differences between document versions",
  //   tags: ["Document Analysis", "Content"],
  //   blocks: [
  //     {
  //       id: "block1",
  //       type: "docannotator",
  //       blockNumber: 1,
  //       document: "This is the original document content",
  //       annotations: [
  //         {
  //           text: "This is the modified document content",
  //           comment: "This is the comment",
  //           startIndex: 0,
  //           endIndex: 10,
  //         },
  //       ],
  //     },
  //   ],
  // },
  {
    id: "doc-annotator",
    name: "Document Annotator",
    description: "Extract and annotate key information from documents",
    agentDescription:
      "Benefit Metrics: Automatically identifies and extracts relevant information from documents",
    tags: ["Document Handling", "Analysis"],
    blocks: [
      {
        id: "block1",
        type: "docannotator",
        blockNumber: 1,
        sourceName: "Investor call transcript",
        sourceLink:
          "https://docs.google.com/document/d/129-MgWwNgxWNAQ-_wgPM8C-TRToLalsWnCG9qKfWyYE/edit?usp=sharing",
        prompt: "identify any conversations about mergers and acquisitions",
        annotatedDocLink:
          "https://drive.google.com/file/d/14KmW2bd4CtWxi9dfgw-F8OZMjKbeB-9m/preview",
        extractedChunks: [
          "mergers & acquisitions",
          "strategic M&A opportunities",
          "early conversations with a European data modeling startup",
          "finalized an acquisition of OpsBot",
        ],
        isCompleted: true,
        output: "Extraction complete!",
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "{{transcript_extraction}} represents the parts of an investor call, related to mergers and acquisitions. @investor_call_transcript represents the full transcript. Produce a concise summary of what the company is sayign to investors, specifically about mergers and acquisitions.",
        outputVariable: {
          name: "summary",
        },
        output: `Summary of Mergers & Acquisitions Discussion: The company is actively pursuing strategic mergers and acquisitions to enhance its product offerings. For Flow, they are exploring opportunities in the document summarization space. Beacon may see an expansion through early-stage discussions with a European data modeling startup. Most notably, Nexus has finalized the acquisition of OpsBot, a lightweight SRE monitoring tool, which will be integrated by Q3. These moves reflect a targeted approach to expanding capabilities across all core products.`,
      },
    ],
  },
  {
    id: "email-lead-qualifier",
    name: "Qualify leads via Email",
    description:
      "This agent goes back and forth with a prospective lead, to assess if this is a legitimate lead or not. ",
    // description:
    //   "This agent goes back and forth with a prospective lead, asking the right questions to qualify if this is a legitimate lead or not. It then makes a judgement on if this is a valid lead, and passes it onto the sales associate.",
    agentDescription:
      "Benefit Metrics: 100% of leads that your sales associates work with are qualified leads. Hours saved per day asking useless questions.",
    tags: ["Sales", "Receive Emails"],
    start_method: "email",
    blocks: [
      {
        id: "block1",
        type: "simulatedemail",
        blockNumber: 1,
        from: "jack@jacksapplecider.com",
        subject: "inquiry",
        body: "hey there! I'm jack, im the founder of Jacks Apple Cider. I saw your website come up while looking for a packaging and distributions partner to help with our US shipments. ",
        attachments: [],
      },
      {
        id: "block2",
        type: "agent",
        blockNumber: 2,
        checkin: true,
        output: `
  - What we know:
      •	The sender is based in the U.S. and is looking for help with U.S. shipments (✅ no international shipping).
      •	They are in the beverage industry (Jack's Apple Cider), which may imply glass bottles, cans, or liquid-safe packaging — but no explicit mention of specialty packaging yet.
  
  - Questions to ask:
      •	What is your monthly order volume (we require a minimum of 10,000 units/month)?
      •	Does your packaging require anything specialty (e.g. biodegradable, temperature-sensitive, etc.)?
  
  ⸻
  
  Email Response:
  
  ⸻
  
  Subject: Quick Follow-Up on Your Packaging Inquiry
  
  Hi Jack,
  
  Thanks for reaching out — great to hear from you, and Jack's Apple Cider sounds awesome!
  
  To make sure we're the right fit, I just have a couple quick questions:
      •	What's your estimated monthly order volume?
      •	Does your packaging require anything specialty (e.g. biodegradable, temperature-sensitive, etc.)?
  
  Once I have that, I can point you in the right direction or connect you with someone on our team.
  
  Looking forward to hearing from you!
  
  Best,
  Alan the Lead Qualifier Agent
          `,
        outputVariable: {
          name: "lead_qualification",
          value: "",
        },
        userPrompt: `
          You qualify leads for a packaging and distribution company. Your job is to determine whether a prospective customer is a good fit for the business.
  
  You do this by:
      1.	Reading the contents of inbound emails from prospective customers.
      2.	Identifying what information is already provided.
      3.	Identifying what additional information you need to determine fit.
      4.	Sending a clear and polite email requesting only the missing details.
  
  You are evaluating leads based on the following criteria:
      •	Order Volume: Must be at least 10,000 units per month
      •	Packaging Type: Must not require specialty packaging (e.g. biodegradable, temperature-sensitive, medical-grade, etc.)
      •	Shipping Requirements: Must not require international shipping
  
  When responding, structure your internal assessment using this format:
  
  ⸻
  
  What we know:
  [List the information the sender has already provided that maps to the qualification criteria.]
  
  Questions to ask:
  [List any remaining questions you need to determine if the lead is a good fit.]
  
  Then, draft an email that politely and professionally asks for just the missing information.
  
  Keep the tone friendly, efficient, and professional.
          `,
      },
      {
        id: "block3",
        type: "agent",
        blockNumber: 3,
        checkin: true,
        userPrompt: `
          {{lead_qualification}} represents a summary of what information we have and what we need, to determine if this lead would be a good fit for our business. take the 'questions to ask', and create an email that asks those questions. this will go directly to the user, so stay in keeping with our content guidelines. No fluff or filler language before or after the email. `,
        output: `
  Subject: Quick Follow-Up on Your Packaging Inquiry
  
  Hi Jack,
  
  Thanks for reaching out — great to hear from you, and Jack's Apple Cider sounds awesome!
  
  To make sure we're the right fit, I just have a couple quick questions:
      •	What's your estimated monthly order volume?
      •	Does your packaging require anything specialty (e.g. biodegradable, temperature-sensitive, etc.)?
  
  Once I have that, I can point you in the right direction or connect you with someone on our team.
  
  Looking forward to hearing from you!
  
  Best,
  Alan the Lead Qualifier Agent
          `,
        outputVariable: {
          name: "lead_qualification_email",
          value: "",
        },
      },
      {
        id: "email_response_block",
        type: "contact",
        checkin: true,
        blockNumber: 4,
        to: "jack@jacksapplecider.com",
        subject: "Quick Follow-Up on Your Packaging Inquiry",
        body: "{{lead_qualification_email}}",
        outputVariable: {
          name: "email_sent",
          value: "",
        },
        output: "📨 email sent!",
      },
    ],
  },

  {
    id: "job-description-agent",
    name: "Create Job Description",
    description:
      "Interactive job description creation assistant for internal teams",
    agentDescription:
      "This agent facilitates the job description creation process by engaging with internal team members, validating hiring needs, and crafting appropriate job descriptions. It ensures external hiring is justified and produces well-structured job descriptions aligned with team requirements. Benefit Metrics: Reduces JD creation time by 70%, ensures consistency in hiring requirements, and validates hiring needs before posting.",
    tags: ["HR", "Admin", "Content"],
    start_method: "email",
    blocks: [
      {
        id: "initial_request_block",
        type: "simulatedemail",
        blockNumber: 1,
        from: "priya@usesolari.ai",
        subject: "Need Help Creating Job Posting",
        body: "Hey,\n\nWe're looking to hire a new data engineer and need help putting together a job description and posting. Can you help us draft something we can use for the listing?\n\nThanks!\n[Your Name]\nData Engineering Team",
        attachments: [],
      },
      {
        id: "initial_response_block",
        type: "contact",
        blockNumber: 2,
        to: "{{requester_email}}",
        subject: "Re: Need Help Creating Job Posting",
        body: "Great! Happy to help.\n\nCan you share a bit more detail so I can get started? Specifically:\n\t•\tWhat's the rough job description or what will this person be working on?\n\t•\tWhat are the most critical skills or tools they should have experience with?\n\t•\tDo you have a sense of how many years of experience you're looking for?\n\nOnce I have that, I can put together a draft for you.\n\nBest,\n[Agent Name]",
        outputVariable: {
          name: "initial_response_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "requirements_response_block",
        type: "simulatedemail",
        blockNumber: 3,
        from: "priya@usesolari.ai",
        subject: "Re: Need Help Creating Job Posting",
        body: "1. they will be a data engineer- building reliable ETL pipelines based on requirements from product and data\n2. python, sql - bonus points for any direct machine learning, data engineering or software engineering roles\n3. not sure how many years of experience",
        attachments: [],
      },
      {
        id: "experience_clarification_block",
        type: "contact",
        blockNumber: 4,
        to: "{{requester_email}}",
        subject: "Re: Need Help Creating Job Posting",
        body: "got it! thanks for that. For years of experience - our default is 2 years of work experience after an undergradate degree. Can i put that as an optional requirement?",
        outputVariable: {
          name: "experience_clarification_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "experience_confirmation_block",
        type: "simulatedemail",
        blockNumber: 5,
        from: "priya@usesolari.ai",
        subject: "Re: Need Help Creating Job Posting",
        body: "sounds good!",
        attachments: [],
      },
      {
        id: "internal_review_block",
        type: "agent",
        blockNumber: 6,
        userPrompt:
          "review the job requirements, and identify any team members that may be good fits for internal transfers",
        outputVariable: {
          name: "potential_internal_teams",
          value: "data (matt)",
        },
        output: "data (matt) ",
      },
      {
        id: "internal_check_email_block",
        type: "agent",
        blockNumber: 7,
        userPrompt:
          "create an email asking the team member if they have asked the members in {{potential_internal_teams}} for any potential internal migrations.",
        outputVariable: {
          name: "confirmation_email",
          value:
            "great! and can i confirm that you've smoke with matt from our analyst team to confirm no members of his team would be elivible for/open to an internal transfer? These can be more efficient than looking online, as these team members already know everything about our company and processes etc..",
        },
        output:
          "great! and can i confirm that you've smoke with matt from our analyst team to confirm no members of his team would be elivible for/open to an internal transfer? These can be more efficient than looking online, as these team members already know everything about our company and processes etc..",
      },
      {
        id: "internal_check_send_block",
        type: "contact",
        blockNumber: 8,
        to: "{{requester_email}}",
        subject: "Re: Need Help Creating Job Posting",
        body: "{{confirmation_email}}",
        outputVariable: {
          name: "internal_check_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "internal_check_response_block",
        type: "simulatedemail",
        blockNumber: 9,
        from: "priya@usesolari.ai",
        subject: "Re: Need Help Creating Job Posting",
        body: "yes! i spoke with matt, but unfortunately soonest someone could offboard from their current projects and join the data eng team is q3 which is a bit late for us!",
        attachments: [],
      },

      {
        id: "deadline_check_block",
        type: "contact",
        blockNumber: 10,
        to: "{{requester_email}}",
        subject: "Re: Need Help Creating Job Posting",
        body: "Got it! So i gather you have a deadline of when you'd need a new person by?",
        outputVariable: {
          name: "deadline_check_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "deadline_response_block",
        type: "simulatedemail",
        blockNumber: 11,
        from: "priya@usesolari.ai",
        subject: "Re: Need Help Creating Job Posting",
        body: "yes! good catch. I'll need them in by the end of next month at the latest.",
        attachments: [],
      },
      {
        id: "jd_creation_block",
        type: "agent",
        blockNumber: 12,
        userPrompt:
          "agent - summarize all the information into a jd, matching this source @marketing operations job description",
        attachedFile: {
          name: "marketing operations",
          type: "PDF",
          url: "https://docs.google.com/document/d/1TjIGxVHc-uEBgh58K3nZjyboCjW5jM6HdGQPOPoGq0s/edit?usp=sharing",
          content: "@marketing operations",
        },
        outputVariable: {
          name: "draft_jd",
          value: "",
        },
        output: `got it! here's the JD we have made.
  Job Title: Data Engineer
  
  Location: [Insert Location or "Remote"]
  Team: Data & Infrastructure
  Reports To: [Insert Manager Title or Name]
  
  ⸻
  
  About the Role
  
  We're looking for a Data Engineer to join our team and help build reliable, scalable ETL pipelines that serve critical data needs across product and analytics. You'll work closely with our Product and Data teams to turn business requirements into clean, production-grade data workflows.
  
  ⸻
  
  What You'll Do
      •	Design, build, and maintain robust ETL pipelines
      •	Collaborate with Product and Data teams to define data requirements
      •	Ensure high data quality and integrity across systems
      •	Optimize data infrastructure for scalability and performance
      •	Contribute to data modeling and tooling efforts across the organization
  
  ⸻
  
  What We're Looking For
      •	Strong proficiency in Python and SQL
      •	Bonus: experience with machine learning, data engineering, or software engineering projects
      •	Experience working with modern data stacks (e.g. Airflow, dbt, Snowflake, etc.) is a plus
      •	Ability to work cross-functionally with both technical and non-technical teams
  
  ⸻
  
  Preferred Qualifications
      •	2+ years of professional experience after an undergraduate degree (preferred but not required)
      •	Bachelor's degree in Computer Science, Engineering, or a related technical field
          
          `,
      },
      {
        id: "final_jd_send_block",
        type: "contact",
        blockNumber: 13,
        to: "{{requester_email}}",
        subject: "Re: Need Help Creating Job Posting - Draft JD",
        body: "{{draft_jd}}",
        outputVariable: {
          name: "final_jd_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
    ],
  },
  {
    id: "edit-documents-agent",
    name: "Find and Edit Documents based on input",
    description:
      "This agent helps you edit multiple documents based on a single input, by finding relevant documents and showing you suggested edits for each",
    agentDescription:
      "This agent helps you edit multiple documents based on a single input, by finding relevant documents and showing you suggested edits for each",
    tags: ["HR", "Admin", "Content", "Project Management"],
    start_method: "manual",
    blocks: [
      {
        id: "initial_agent_block",
        type: "agent",
        blockNumber: 1,
        userPrompt:
          "we're no longer doing email campaigns for projects below $5m in annual revenue. I need to edit documents that are relevant. Please write some SQL code that pulls a list of all projects that are making 5m or below in ARR",
        output: `SELECT 
    project_name,
    annual_recurring_revenue as ARR
  FROM projects
  WHERE annual_recurring_revenue <= 5000000
    AND has_email_campaigns = true
  ORDER BY annual_recurring_revenue DESC;`,
        outputVariable: {
          name: "sql",
        },
      },
      {
        id: "sql_execution_block",
        type: "codeblock",
        blockNumber: 2,
        language: "sql",
        code: "{{sql}}",
        output:
          "Re-engagement campaign for closed-lost leads\nPartnership campaign to co-market with SaaS platforms",
        outputVariable: {
          name: "sql_output",
        },
      },
      {
        id: "cleanup_agent_block",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "{{sql_output}} is a list of projects. please clean the response so it is a comma separated list",
        output:
          "Re-engagement campaign for closed-lost leads, Partnership campaign to co-market with SaaS platforms",
        outputVariable: {
          name: "output_cleaned",
        },
      },

      {
        id: "docdiff_block",
        type: "docdiff",
        blockNumber: 3,
        input_prompt:
          "We're no longer doing cold email campaigns for projects below 5m ARR. {{output_cleaned}} is a list of projects that are below 5m ARR. Please edit documents related to those projects, and any other related documents",
        document_diffs: [
          {
            document_name: "Cold Email Marketing Campaigns for Q4 2025",
            original: `Cold Email Marketing Campaigns for Q4 2025
Projects:
- Cold outreach to freemium users who haven't upgraded
- Re-engagement campaign for closed-lost leads
- Partnership campaign to co-market with SaaS platforms
- Personalized demos for top 100 MQLs
- Industry-specific campaigns (finance, health, retail)

Timeline:
All campaigns scheduled between October 15th and December 20th.
`,
            modified: `Cold Email Marketing Campaigns for Q4 2025

Projects:
- Cold outreach to freemium users who haven't upgraded
- Personalized demos for top 100 MQLs
- Industry-specific campaigns (finance, health, retail)

Timeline:
All campaigns scheduled between October 15th and December 20th.
`,
          },
          {
            document_name: "Marketing Team 2025 Roadmap",
            original: `Q1 Initiatives:
- Launch freemium user cold outreach program
- Launch re-engagement campaign for closed-lost leads
- Develop co-marketing partnerships with SaaS platforms
- Execute personalized demo initiative for MQLs
- Build industry-specific targeted campaigns
- Launch content refresh initiative for SEO

Q2 Initiatives:
- Host quarterly customer webinars
- Expand social media paid advertising
- Optimize website conversion funnel
`,
            modified: `Q1 Initiatives:
- Launch freemium user cold outreach program
- Execute personalized demo initiative for MQLs
- Build industry-specific targeted campaigns
- Launch content refresh initiative for SEO

Q2 Initiatives:
- Host quarterly customer webinars
- Expand social media paid advertising
- Optimize website conversion funnel
`,
          },
          {
            document_name: "Cold Email Marketing Campaign Guide",
            original: `Purpose: This document outlines the strategy and guidelines for cold email campaigns used by the marketing team to drive pipeline and engage qualified leads.

Campaign Scope:
All projects get cold email marketing campaigns, but have to stay within their overall growth budget. Campaigns are expected to align with each project's ICP (ideal customer profile), timing, and available sales support.

Execution Process:
1. Campaign brief submitted to demand gen team
2. Copy and targeting reviewed by legal and brand
3. Launch approval by marketing operations
4. Live reporting shared weekly in the campaign dashboard

Metrics:
- Open Rate ≥ 30%
- Reply Rate ≥ 5%
- Qualified meeting rate ≥ 3%
`,
            modified: `Purpose: This document outlines the strategy and guidelines for cold email campaigns used by the marketing team to drive pipeline and engage qualified leads.

Campaign Scope:
Only projects with above $5M in ARR get cold email campaigns. Campaigns are expected to align with each project's ICP (ideal customer profile), timing, and available sales support.

Execution Process:
1. Campaign brief submitted to demand gen team
2. Copy and targeting reviewed by legal and brand
3. Launch approval by marketing operations
4. Live reporting shared weekly in the campaign dashboard

Metrics:
- Open Rate ≥ 30%
- Reply Rate ≥ 5%
- Qualified meeting rate ≥ 3%
`,
          },
        ],
      },
    ],
  },
  {
    id: "edit-maintain-org-chart",
    name: "Maintain a Live Org Chart of your company",
    description:
      "This agent helps you maintain a live picture of your company's structure. You can keep it up to date by passing in a change, and the document will update accordingly.",
    agentDescription:
      "This agent helps you maintain a live picture of your company's structure. You can keep it up to date by passing in a change, and the document will update accordingly.",
    tools: ["docdiff"],
    tags: ["HR", "Admin", "Content"],
    start_method: "manual",
    blocks: [
      {
        id: "docdiff_block",
        type: "docdiff",
        blockNumber: 1,
        input_prompt: "Data moved from product to eng",
        document_diffs: [
          {
            document_name: "Company Organization Structure – 2025",
            original: `
Executive Leadership:
- CEO: Jamie Patel
- CFO: Morgan Lee
- CTO: Alex Kim
- CMO: Priya Desai

Product Division:
- VP of Product: Sophia Nguyen
- Product Management Team
- User Research Team
- Analytics Team

Engineering Division:
- VP of Engineering: Daniel Rivera
- Frontend Engineering Team
- Backend Engineering Team
- Infrastructure Team

Marketing Division:
- VP of Marketing: Arjun Mehta
- Content Marketing Team
- Performance Marketing Team
- Brand and Communications Team
`,
            modified: `
            Executive Leadership:
- CEO: Jamie Patel
- CFO: Morgan Lee
- CTO: Alex Kim
- CMO: Priya Desai

Product Division:
- VP of Product: Sophia Nguyen
- Product Management Team
- User Research Team

Engineering Division:
- VP of Engineering: Daniel Rivera
- Frontend Engineering Team
- Backend Engineering Team
- Infrastructure Team
- Analytics Team

Marketing Division:
- VP of Marketing: Arjun Mehta
- Content Marketing Team
- Performance Marketing Team
- Brand and Communications Team
`,
          },
        ],
      },
    ],
  },
  {
    id: "web-agent-1",
    name: "Automated Job Posting Agent",
    description:
      "This agent takes a job description, and programmatically posts it to different job boards",
    agentDescription:
      "This agent takes a job description, and programmatically posts it to different job boards",
    tools: ["webscraper", "agent"],
    tags: ["HR", "Admin", "Content"],
    start_method: "manual",
    blocks: [
      {
        id: "block1",
        type: "webscraper",
        blockNumber: 1,
        prompt: "Post the job on wellfound",
        usableInputs: [
          { key: "username", value: "sahil@lytix.co" },
          { key: "password", value: "password123" },
          { key: "job_title", value: "Data Analyst" },
          {
            key: "job_description",
            value: `We are looking for a Data Analyst to join our team. The ideal candidate will have strong SQL and Python skills, a Bachelor's degree in a quantitative field (such as statistics, math, or computer science), and at least 2 years of relevant industry experience.
      
      Responsibilities:
      - Analyze data and generate insights to inform business decisions
      - Build dashboards and reports
      - Work cross-functionally with product and engineering teams
      - Ensure data quality and integrity
      
      Requirements:
      - Proficiency in SQL and Python
      - Bachelor's degree in a quantitative field
      - 2+ years of experience in data analysis or related roles
      - Strong communication and visualization skills`,
          },
          {
            key: "job_description_pdf",
            value:
              "https://example.com/downloads/data-analyst-job-description.pdf",
          },
        ],
        startingUrl: "https://wellfound.com/",
        webBlocks: [
          {
            url: "https://wellfound.com/",
            dom: `<body>
  <header>
    <nav>
      <a href="/recruit">For Companies</a>
      <a href="/login">Log In</a>
      <a href="/signup">Sign Up</a>
    </nav>
  </header>
  <main>
    <!-- Main content -->
  </main>
</body>`,
            suggestedNextAgentAction: "Navigate to /recruit",
          },
          {
            url: "https://wellfound.com/recruit",
            dom: `<body>
            <header>
              <nav>
                <a href="/recruit/all-features/post-a-job">Post a Job</a>
                <a href="/recruit/overview">Overview</a>
              </nav>
            </header>
            <main>
              <!-- Recruiter-specific content -->
            </main>
          </body>`,
            suggestedNextAgentAction:
              "Click on the “Post a Job” link to initiate the job posting process.",
          },
          {
            url: "https://wellfound.com/recruit/all-features/post-a-job",
            dom: `<body>
            <header>
              <nav>
                <a href="/recruit/all-features/post-a-job">Post a Job</a>
                <a href="/recruit/overview">Overview</a>
              </nav>
            </header>
            <main>
              <!-- Recruiter-specific content -->
            </main>
          </body>`,

            suggestedNextAgentAction:
              "Fill in the form fields with the job details:",
          },
        ],
        outputVariable: {
          name: "scraped_data",
        },
        output: "Job posted!",
      },
      {
        id: "block2",
        type: "webscraper",
        blockNumber: 2,
        prompt: "Post the job on LinkedIn",
        startingUrl: "https://www.linkedin.com/",
        usableInputs: [
          { key: "job_title", value: "Data Analyst" },
          {
            key: "job_description",
            value:
              "We are looking for a Data Analyst to join our team. The ideal candidate will have strong SQL and Python skills, a Bachelor's degree in a quantitative field, and at least 2 years of relevant industry experience.\n\nResponsibilities:\n- Analyze data and generate insights to inform business decisions\n- Build dashboards and reports\n- Work cross-functionally with product and engineering teams\n- Ensure data quality and integrity\n\nRequirements:\n- Proficiency in SQL and Python\n- Bachelor's degree in a quantitative field\n- 2+ years of experience in data analysis or related roles\n- Strong communication and visualization skills",
          },
          { key: "location", value: "New York, NY" },
          { key: "employment_type", value: "FULL_TIME" },
          { key: "company_name", value: "Lytix" },
          { key: "poster_email", value: "sahil@lytix.co" },
        ],
        webBlocks: [
          {
            url: "https://www.linkedin.com/",
            dom: '<body><header><nav><a href="/login">Sign In</a><a href="/jobs">Jobs</a></nav></header><main><!-- Main content --></main></body>',

            suggestedNextAgentAction:
              "Click on 'Sign In' and log in with provided credentials.",
          },
          {
            url: "https://www.linkedin.com/jobs/",
            dom: '<body><header><nav><a href="/jobs/post">Post a Job</a></nav></header><main><!-- Jobs content --></main></body>',
            suggestedNextAgentAction:
              "Navigate to '/jobs/post' to start the job posting process.",
          },
          {
            url: "https://www.linkedin.com/jobs/post",
            dom: '<body><main><form id="job-post-form"><input name="job_title" /><textarea name="job_description"></textarea><input name="location" /><select name="employment_type"><option value="FULL_TIME">Full-time</option><option value="PART_TIME">Part-time</option></select><input name="company_name" /><input name="poster_email" /><button type="submit">Post Job</button></form></main></body>',

            suggestedNextAgentAction:
              "Fill in the form fields with the job details and submit the form to post the job.",
          },
        ],
        outputVariable: {
          name: "scraped_data",
        },
        output: "Job posted on LinkedIn!",
      },
    ],
  },
  {
    id: "web-agent-2",
    name: "Search a company's LinkedIn for Relevant Leaders",
    description:
      "This agent looks through a given comapny's LinkedIn, for members that match a specific profile, and returns a list of results",
    agentDescription:
      "This agent looks through a given comapny's LinkedIn, for members that match a specific profile, and returns a list of results",
    tools: ["web", "agent"],
    tags: ["Sales"],
    start_method: "manual",
    blocks: [
      {
        id: "block1",
        type: "webscraper",
        blockNumber: 1,
        prompt:
          "Look for directors, managers and leaders in Ops, procurement and contracts",
        usableInputs: [
          { key: "username", value: "sahil@lytix.co" },
          { key: "password", value: "password123" },
          { key: "company_name", value: "Acme Corp" },
        ],
        startingUrl: "https://www.linkedin.com/",
        webBlocks: [
          {
            url: "https://www.linkedin.com/",
            dom: `<body>
              <header>
                <nav>
                  <a href="/login">Sign in</a>
                </nav>
              </header>
              <main><!-- Landing content --></main>
            </body>`,
            suggestedNextAgentAction:
              "Click on 'Sign in' and log in using provided credentials.",
          },
          {
            url: "https://www.linkedin.com/login",
            dom: `<body>
              <main>
                <form id="login-form">
                  <input name="session_key" />
                  <input name="session_password" />
                  <button type="submit">Sign in</button>
                </form>
              </main>
            </body>`,
            suggestedNextAgentAction:
              "Submit the login form using username and password from usableInputs.",
          },
          {
            url: "https://www.linkedin.com/feed/",
            dom: `<body>
              <header>
                <form id="global-search-bar">
                  <input name="q" placeholder="Search" />
                </form>
              </header>
              <main><!-- Feed content --></main>
            </body>`,
            suggestedNextAgentAction:
              "Enter {{company_name}} into the search bar and submit search.",
          },
          {
            url: "https://www.linkedin.com/company/{{company_name_slug}}",
            dom: `<body>
              <main>
                <nav>
                  <a href="/company/{{company_name_slug}}/people">People</a>
                </nav>
              </main>
            </body>`,
            suggestedNextAgentAction:
              "Click the 'People' tab to view employees of the company.",
          },
          {
            url: "https://www.linkedin.com/company/{{company_name_slug}}/people",
            dom: `<body>
              <main>
                <div class="search-filters">
                  <input name="keywords" placeholder="Search employees" />
                  <button type="search">Search</button>
                </div>
                <section class="employee-results">
                  <!-- List of employees -->
                </section>
                <footer class="pagination">
                  <a href="?page=2">Next</a>
                </footer>
              </main>
            </body>`,
            suggestedNextAgentAction:
              "Search for 'director OR manager OR head' AND ('operations' OR 'procurement' OR 'contracts'), then paginate through the next 2 pages to collect results.",
          },
        ],
        outputVariable: {
          name: "employee_matches",
        },
        output: `
        [
  {
    "name": "Sarah Kim",
    "title": "Director of Procurement",
    "linkedin": "https://www.linkedin.com/in/sarah-kim-acme"
  },
  {
    "name": "Jared Singh",
    "title": "Head of Operations",
    "linkedin": "https://www.linkedin.com/in/jared-singh-acme"
  },
  {
    "name": "Lena Moore",
    "title": "Senior Contracts Manager",
    "linkedin": "https://www.linkedin.com/in/lena-moore-acme"
  },
  {
    "name": "Daniel Brooks",
    "title": "Global Supply Chain Manager",
    "linkedin": "https://www.linkedin.com/in/daniel-brooks-acme"
  },
  {
    "name": "Emily Zhao",
    "title": "VP, Strategic Sourcing & Procurement",
    "linkedin": "https://www.linkedin.com/in/emily-zhao-acme"
  },
  {
    "name": "Carlos Ortega",
    "title": "Operations Program Manager",
    "linkedin": "https://www.linkedin.com/in/carlos-ortega-acme"
  }
]`,
      },
    ],
  },
  {
    id: "web-agent-3",
    name: "Daily Product Listing Check",
    description:
      "This agent visits a website, and checks it against a set of requirements. It runs on a daily schedule, and emails the owner a summary of the analysis.",
    agentDescription:
      "This agent visits a website, and checks it against a set of requirements. It runs on a daily schedule, and emails the owner a summary of the analysis.",
    tools: ["web", "agent", "contact"],
    tags: ["HR", "Admin", "Content"],
    start_method: "schedule",
    blocks: [
      {
        id: "block1",
        type: "webagent",
        blockNumber: 1,
        url: "https://www.amazon.com/Natures-Sunshine-Developed-Respiratory-Challenged/dp/B000MPSK78?_encoding=UTF8&fpw=new&fpl=fresh&ref_=eemb_m_d_3_3_i&pf_rd_p=041b5b8a-2a42-4880-9e35-94c805e4fa3d&pf_rd_r=MH9D2Z9FYB8GMWSM0F35",
        nickname: "@amazon",
        outputVariable: {
          name: "amazon_summary",
        },
        output: "Website processed!",
      },
      {
        id: "amazon_description_analysis_block",
        type: "agent",
        blockNumber: 2,
        userPrompt: `analyse @amazon, and tell me if the description includes these phrases: 
      Helps soothe irritated tissues
      Encourages the entire respiratory tract to gently cleanse itself
      Supports healthy lung function
      Assists the body in neutralizing allergens by nutritional means
      Provides effective respiratory system support
      Promotes clear and comfortable breathing with soothing botanical support.`,
        outputVariable: {
          name: "description_analysis",
          value: `
      ✅ Helps soothe irritated tissues
      ✅ Encourages the entire respiratory tract to gently cleanse itself
      ✅ Supports healthy lung function
      ✅ Assists the body in neutralizing allergens by nutritional means
      ✅ Provides effective respiratory system support
      ❌ Promotes clear and comfortable breathing with soothing botanical support.`,
        },
        output: `
      ✅ Helps soothe irritated tissues
      ✅ Encourages the entire respiratory tract to gently cleanse itself
      ✅ Supports healthy lung function
      ✅ Assists the body in neutralizing allergens by nutritional means
      ✅ Provides effective respiratory system support
      ❌ Promotes clear and comfortable breathing with soothing botanical support.`,
      },
      {
        id: "amazon_price_analysis_block",
        type: "agent",
        blockNumber: 3,
        userPrompt: `analyse @amazon, and tell me if the price is below $25`,
        outputVariable: {
          name: "price_analysis",
          value: `✅ Price is below $21.96`,
        },
        output: `✅ Price is below $21.96`,
      },
      {
        id: "amazon_price_analysis_block",
        type: "agent",
        blockNumber: 4,
        userPrompt: `analyse @amazon, and tell me what SKUS are available for this product (I should see 3 for small, medium and large sizes)`,
        outputVariable: {
          name: "sku_analysis",
          value: `❌ There are no SKUs attached`,
        },
        output: `❌ There are no SKUs attached`,
      },
      {
        id: "final_summary",
        type: "agent",
        blockNumber: 5,
        userPrompt: `{{amazon_summary}} {{description_analysis}} {{price_analysis}} {{sku_analysis}} are all the results of analysing an Amazon link, and comparing it to a set of requirements. Compile the results into a single checklist, with any issues at the top. `,
        outputVariable: {
          name: "final_summary",
          value: `
          SKUs - 
            ❌ There are no SKUs attached
            Desscription - 
            ❌ Promotes clear and comfortable breathing with soothing botanical support.
            ✅ Helps soothe irritated tissues
            ✅ Encourages the entire respiratory tract to gently cleanse itself
            ✅ Supports healthy lung function
            ✅ Assists the body in neutralizing allergens by nutritional means
            ✅ Provides effective respiratory system support
            Price - 
            ✅ Price is below $21.96
            `,
        },
        output: `
        SKUs - 
            ❌ There are no SKUs attached
            Desscription - 
            ❌ Promotes clear and comfortable breathing with soothing botanical support.
            ✅ Helps soothe irritated tissues
            ✅ Encourages the entire respiratory tract to gently cleanse itself
            ✅ Supports healthy lung function
            ✅ Assists the body in neutralizing allergens by nutritional means
            ✅ Provides effective respiratory system support
            Price - 
            ✅ Price is below $21.96
            `,
      },
      {
        id: "email-block",
        type: "contact",
        blockNumber: 6,
        to: "sahil@solari.ai",
        subject: "Daily Amazon Check",
        body: "{{final_summary}}",
        outputVariable: {
          name: "nina_email_sent",
          value: "",
        },
        output: "Response 200: 📨 email sent!",
      },
    ],
  },
  {
    id: "autonomous-agent",
    name: "Lead Qualification Agent",
    description:
      "Respond to incoming leads, and ask the necessary questions to qualify them and determine if they are viable leads",
    agentDescription:
      "Benefit Metrics: Automatically track Instagram profile changes and analyze engagement patterns, saving hours of manual monitoring.",
    tags: ["Sales", "Receive Emails"],
    start_method: "email",
    blocks: [
      {
        id: "block1",
        type: "simulatedemail",
        blockNumber: 1,
        from: "jack@jacksapplecider.com",
        subject: "inquiry",
        body: "hey there! I'm jack, im the founder of Jacks Apple Cider. I saw your website come up while looking for a packaging and distributions partner to help with our US shipments. ",
        attachments: [],
      },
    ],
  },
  {
    id: "pawlicy-clinic-router",
    name: "Pawlicy Clinic Router",
    description: "Routes clinic inquiries and manages responses",
    agentDescription: "Handles clinic routing and communication workflow",
    tags: ["Admin", "Sales"],
    blocks: [
      {
        id: "make-block-1",
        type: "make",
        blockNumber: 1,
        webhookUrl: "https://api.pipedrive.com/v1/deals?status=open",
        parameters: [
          {
            key: "url",
            value: "https://api.pipedrive.com/v1/deals?status=open",
          },
        ],
        outputVariable: {
          name: "pipedrive_data",
          value: `[
            {
              "company": "Clinic A",
              "stage": "Prospecting",
              "status": "Open"
            },
            {
              "company": "Clinic B",
              "stage": "Qualification",
              "status": "In Progress"
            },
            {
              "company": "Clinic C",
              "stage": "Proposal",
              "status": "Won"
            },
            {
              "company": "Clinic D",
              "stage": "Negotiation",
              "status": "Lost"
            }
          ]`,
        },
        output: `[
            {
              "company": "Clinic A",
              "stage": "Prospecting",
              "status": "Open"
            },
            {
              "company": "Clinic B",
              "stage": "Qualification",
              "status": "In Progress"
            },
            {
              "company": "Clinic C",
              "stage": "Proposal",
              "status": "Won"
            },
            {
              "company": "Clinic D",
              "stage": "Negotiation",
              "status": "Lost"
            }
          ]`,
      },
      {
        id: "make-block-2",
        type: "make",
        blockNumber: 2,
        webhookUrl: "https://api.clickup.com/api/v2/list/123456789/tasks",
        parameters: [{ key: "Content-Type", value: "application/json" }],
        outputVariable: {
          name: "company_tasks",
          value: `[
          {
            "company": "Clinic E",
            "stage": "Initial Onboarding",
            "status": "In Progress"
          },
          {
            "company": "Clinic F",
            "stage": "Data Integration",
            "status": "Completed"
          },
          {
            "company": "Clinic G",
            "stage": "Training and Support",
            "status": "Scheduled"
          },
          {
            "company": "Clinic H",
            "stage": "Final Check",
            "status": "Pending"
          }
        ]`,
        },
        output: `[
          {
            "company": "Clinic E",
            "stage": "Initial Onboarding",
            "status": "In Progress"
          },
          {
            "company": "Clinic F",
            "stage": "Data Integration",
            "status": "Completed"
          },
          {
            "company": "Clinic G",
            "stage": "Training and Support",
            "status": "Scheduled"
          },
          {
            "company": "Clinic H",
            "stage": "Final Check",
            "status": "Pending"
          }
        ]`,
      },
      {
        id: "agent-block-1",
        type: "agent",
        blockNumber: 3,
        userPrompt:
          "Combine the information in {{company_tasks}} and {{pipedrive_data}} in a single list. Save the output variable as @synced_data",
        systemPrompt:
          "You are an expert in combining data from two sources into a single list. You are given two lists of data, and you need to combine them into a single list.",
        outputVariable: {
          name: "synced_data",
          value: `[
            {
              "company": "Clinic A",
              "stage": "Prospecting",
              "status": "Open"
            },
            {
              "company": "Clinic B",
              "stage": "Qualification",
              "status": "In Progress"
            },
            {
              "company": "Clinic C",
              "stage": "Proposal",
              "status": "Won"
            },
            {
              "company": "Clinic D",
              "stage": "Negotiation",
              "status": "Lost"
            },
            {
            "company": "Clinic E",
            "stage": "Initial Onboarding",
            "status": "In Progress"
          },
          {
            "company": "Clinic F",
            "stage": "Data Integration",
            "status": "Completed"
          },
          {
            "company": "Clinic G",
            "stage": "Training and Support",
            "status": "Scheduled"
          },
          {
            "company": "Clinic H",
            "stage": "Final Check",
            "status": "Pending"
          }
      `,
        },
        output: `[
            {
              "company": "Clinic A",
              "stage": "Prospecting",
              "status": "Open"
            },
            {
              "company": "Clinic B",
              "stage": "Qualification",
              "status": "In Progress"
            },
            {
              "company": "Clinic C",
              "stage": "Proposal",
              "status": "Won"
            },
            {
              "company": "Clinic D",
              "stage": "Negotiation",
              "status": "Lost"
            },
            {
            "company": "Clinic E",
            "stage": "Initial Onboarding",
            "status": "In Progress"
          },
          {
            "company": "Clinic F",
            "stage": "Data Integration",
            "status": "Completed"
          },
          {
            "company": "Clinic G",
            "stage": "Training and Support",
            "status": "Scheduled"
          },
          {
            "company": "Clinic H",
            "stage": "Final Check",
            "status": "Pending"
          }
      `,
      },
      {
        id: "converse-block",
        type: "conversingagent",
        blockNumber: 4,
        channel: "email", // Add this
        sources: ["@synced_data"], // Add this
        objective:
          "Use @synced_data to route the user to the right team, based on their status in Pawlicy. Customers that are talking to sales but not yet purchased should speak to sales. Clinics that have purchased a membership should be routed to customer success",
        messages: [
          {
            type: "incoming",
            content:
              "Hey there! I received a brochure from you guys - I had a few questions about Pawlicy advisor",
          },
          {
            type: "outgoing",
            content:
              "Great! Would you mind answering a few questions to help us route you to the right team? Do you have an active membership with us or still exploring?",
          },
          {
            type: "incoming",
            content:
              "Hmm I'm not sure, I've spoken to a sales rep but I can't remember if i signed.",
          },
          {
            type: "outgoing",
            content:
              "No worries, checking our data it looks like you haven't signed yet. We'll route you to the right team accordingly",
          },
        ],
        systemPrompt: "Example system prompt for conversation",
        outputVariable: {
          name: "pawlicy_clinic_router_output",
          value: "sales",
        },
        output:
          "Based on the thread and @synced data, the user should be routed to the sales team",
      },
      {
        id: "agent-block-2",
        type: "agent",
        blockNumber: 5,
        userPrompt:
          "Based on the decision in @pawlicy_clinic_router_output, create the necessary API call to update ClickUp accordingly",
        systemPrompt:
          "You are an expert in ClickUp, and you are given a task to update the status of a task in ClickUp based on the decision in @pawlicy_clinic_router_output",
        outputVariable: {
          name: "clickup_api_call",
          value:
            "{team: sales, status: new, description: 'Speak to incoming clinic request'}",
        },
        output:
          "{team: sales, status: new, description: 'Speak to incoming clinic request'}",
      },
      {
        id: "curl_request_block",
        type: "codeblock",
        blockNumber: 6,
        language: "bash",
        code: `curl -X POST \
      https://api.clickup.com/api/v2/list/123/task \
      -H 'Authorization: your_clickup_api_key' \
      -H 'Content-Type: application/json' \
      -d '{{clickup_api_call}}'`,
        outputVariable: {
          name: "curl_response",
          value: "Response from ClickUp API",
        },
        output: "Task updated in ClickUp",
      },
      {
        id: "team_notification_block",
        type: "agent",
        blockNumber: 7,
        userPrompt:
          "Draft a message to the team in {{pawlicy_clinic_router_output}} to let them know they have this task {{clickup_api_call}}",
        systemPrompt:
          "You are an expert in team communication, and you are given a task to draft a message to the team in {{pawlicy_clinic_router_output}} about the new task {{clickup_api_call}}",
        outputVariable: {
          name: "team_notification_message",
          value:
            "Hello {{pawlicy_clinic_router_output}},\n\nWe have a new task assigned to the team: {{clickup_api_call}}.\n\nPlease review and take necessary actions.\n\nBest, [Your Name]",
        },
        output:
          "Hello {{pawlicy_clinic_router_output}},\n\nWe have a new task assigned to the team: {{clickup_api_call}}.\n\nPlease review and take necessary actions.\n\nBest, [Your Name]",
      },
      {
        id: "slack_notification_block",
        type: "contact",
        blockNumber: 8,
        to: "slack_channel",
        subject: "New Task Notification",
        body: "{{team_notification_message}}",
        outputVariable: {
          name: "slack_notification_response",
          value: "Notification sent to Slack channel",
        },
        output: "Notification sent to Slack channel",
      },
    ],
  },
  {
    id: "tokenomics-strategy-agent",
    name: "Tokenomics Strategy & White Paper Generator",
    description:
      "Automated tokenomics analysis and white paper creation from client materials",
    agentDescription:
      "This agent processes client materials to extract tokenomics insights, creates distribution visualizations, and generates professional white papers. It streamlines the complex process of tokenomics strategy development by automatically analyzing project materials and delivering comprehensive documentation. Benefit Metrics: Reduces tokenomics analysis time by 80%, eliminates manual white paper creation, and saves ~4-5 hours per client consultation.",
    tags: ["Consulting", "Finance", "Content"],
    start_method: "email",
    blocks: [
      {
        id: "initial_tokenomics_request",
        type: "simulatedemail",
        blockNumber: 1,
        from: "client@projectxyz.com",
        subject: "Tokenomics Strategy Support Request",
        body: "Hey,\n\nI'm looking to add a tokenomics strategy to my app. Attached are some materials to give you context about our project, user base, and business model.\n\nCould you help us develop a comprehensive tokenomics framework and documentation?\n\nThanks!\nAlex\nProject XYZ Team",
        attachments: [
          {
            name: "project_materials.pdf",
            type: "pdf",
            content: "Project materials content...",
          },
        ],
      },
      {
        id: "prospecting_questions_block",
        type: "agent",
        blockNumber: 2,
        userPrompt:
          "Review the email content and attached materials. Using @prospecting_leads_guide as a reference, identify any additional questions that need to be answered to deliver the tokenomics strategy. Draft a professional email asking these questions.",
        attachedFile: {
          name: "prospecting_leads_guide.pdf",
          type: "pdf",
          url: "https://docs.google.com/document/d/1MwpQSoL9xZDezMOx54Rtgw7XGWjb-57IA7IuoIwKa1g/edit?usp=sharing",
          content: "Prospecting leads guide content...",
        },
        outputVariable: {
          name: "qualification_questions",
        },
        output:
          "Hey Alex,\n\nThanks for contacting us about tokenomics strategy support! I've reviewed your initial materials and would love to help you develop a comprehensive framework.\n\nA couple of questions about what you're working on to ensure we provide the most relevant strategy:\n\n1. What's your target user base size and current monthly active users? This helps us determine the right token utility mechanisms.\n\n2. Do you have any existing revenue streams or monetization plans? Understanding your business model will help us align the tokenomics with your economic objectives.\n\nOnce I have these details, I can dive deeper into creating your tokenomics strategy and white paper.\n\nBest regards,\nTokenomics Strategy Team",
      },
      {
        id: "send_qualification_questions",
        type: "contact",
        blockNumber: 3,
        to: "client@projectxyz.com",
        subject: "Re: Tokenomics Strategy Support Request",
        body: "{{qualification_questions}}",
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "client_qualification_response",
        type: "simulatedemail",
        blockNumber: 4,
        from: "client@projectxyz.com",
        subject: "Re: Tokenomics Strategy Support Request",
        body: "Hi there,\n\nThanks for the follow-up! Here are the answers to your questions:\n\n1. We currently have about 15,000 monthly active users and are targeting 100,000+ within the next 18 months. Our user base is primarily mobile-first, tech-savvy millennials and Gen Z.\n\n2. We have a freemium model with premium subscriptions ($9.99/month) and we're exploring in-app purchases. About 8% of users convert to premium currently.\n\nHope this helps! Looking forward to seeing what you come up with.\n\nBest,\nAlex",
        attachments: [],
      },
      {
        id: "readiness_check_block",
        type: "agent",
        blockNumber: 5,
        userPrompt:
          "Review the email content and attached materials. Using @prospecting_leads_guide as a reference, identify any additional questions that need to be answered to deliver the tokenomics strategy. Draft a professional email asking these questions.",
        attachedFile: {
          name: "prospecting_leads_guide.pdf",
          type: "pdf",
          url: "https://docs.google.com/document/d/1MwpQSoL9xZDezMOx54Rtgw7XGWjb-57IA7IuoIwKa1g/edit?usp=sharing",
          content: "Prospecting leads guide content...",
        },
        outputVariable: {
          name: "project_readiness",
        },
        output:
          "✅ Ready to proceed with tokenomics strategy development!\n\nProject Summary:\n• App: Project XYZ\n• Current MAU: 15,000\n• Target MAU: 100,000+ (18 months)\n• User Demographics: Mobile-first, tech-savvy millennials & Gen Z\n• Revenue Model: Freemium ($9.99/month) + in-app purchases\n• Conversion Rate: 8% to premium\n• Business Model: Established revenue streams ready for tokenization\n\nAll necessary information collected to develop comprehensive tokenomics strategy.",
      },
      {
        id: "tokenomics_analysis_block",
        type: "agent",
        blockNumber: 6,
        userPrompt:
          "Using the project details from {{project_readiness}} and @tokenomics_strategy as a reference framework, extract key points for developing a white paper and create a comprehensive tokenomics distribution strategy focusing on supply/demand dynamics for Project XYZ.",
        attachedFile: {
          name: "tokenomics_strategy.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1example-tokenomics-strategy-framework/view",
          content: "Tokenomics strategy framework content...",
        },
        outputVariable: {
          name: "tokenomics_analysis",
        },
        output:
          "Tokenomics Analysis Complete for Project XYZ:\n\nKey Points for White Paper:\n• Utility-driven token model with staking rewards\n• Freemium-to-premium conversion incentives\n• Community governance for feature development\n• Deflationary mechanisms through burning\n• Mobile-first user experience integration\n\nTokenomics Distribution:\n• Team & Advisors: 20%\n• Community Rewards: 35%\n• Liquidity Pool: 25%\n• Development Fund: 15%\n• Marketing & Partnerships: 5%\n\nSupply/Demand Drivers:\n• Premium subscription discounts with token payments\n• Staking rewards for long-term holders\n• Governance participation increases demand\n• In-app purchase token utility\n• Monthly burn events tied to revenue",
      },
      {
        id: "distribution_extraction_block",
        type: "agent",
        blockNumber: 7,
        userPrompt:
          "From {{tokenomics_analysis}}, extract only the tokenomics distribution percentages and categories. Format this as clean data suitable for visualization.",
        outputVariable: {
          name: "token_distribution",
        },
        output:
          "Token Distribution Data:\n\nTeam & Advisors: 20%\nCommunity Rewards: 35%\nLiquidity Pool: 25%\nDevelopment Fund: 15%\nMarketing & Partnerships: 5%",
      },
      {
        id: "pie_chart_visualization",
        type: "dataviz",
        blockNumber: 8,
        chosenChart: "pie",
        source: "{{token_distribution}}",
        outputVariable: {
          name: "distribution_chart",
        },
        output: "https://drive.google.com/file/d/1P-nLj0Cdtem7hfVm0pK9P6tQ63E1AD6Z/view?usp=sharing",
      },
      {
        id: "white_paper_generation",
        type: "agent",
        blockNumber: 9,
        userPrompt:
          "Using the analysis from {{tokenomics_analysis}} and the @white_paper_demo template, create a comprehensive white paper draft covering the tokenomics strategy, distribution model, and economic mechanisms for Project XYZ.",
        attachedFile: {
          name: "white_paper_demo.pdf",
          type: "pdf",
          url: "https://drive.google.com/file/d/1example-white-paper-template/view",
          content: "White paper template content...",
        },
        outputVariable: {
          name: "white_paper_draft",
        },
        output:
          "White Paper Draft Complete:\n\n# Project XYZ Tokenomics White Paper\n\n## Executive Summary\nProject XYZ introduces a utility-driven token economy designed to incentivize community participation while enhancing the freemium-to-premium conversion funnel...\n\n## Token Distribution & Allocation\n[Detailed breakdown of the 5-tier allocation strategy]\n\n## Economic Mechanisms\n[Premium subscription discounts, staking rewards, governance participation, deflationary burning]\n\n## Mobile-First Implementation\n[Seamless in-app token integration and user experience]\n\n## Implementation Roadmap\n[Phased rollout strategy over 24 months]\n\nDocument saved as: project-xyz-tokenomics-whitepaper-v1.pdf",
      },
      {
        id: "client_delivery_block",
        type: "contact",
        blockNumber: 10,
        to: "client@projectxyz.com",
        subject: "Your Tokenomics Strategy & White Paper - Ready for Review",
        body: "Hi Alex,\n\nI've completed the comprehensive tokenomics analysis for Project XYZ based on your project details. Please find attached:\n\n1. **Token Distribution Visualization**: {{distribution_chart}}\n2. **White Paper Draft**: {{white_paper_draft}}\n\nThe strategy is specifically tailored to your freemium model and mobile-first user base:\n\n• Community-first approach with 35% token allocation\n• Premium subscription integration with token utility\n• Mobile-optimized token experience\n• Deflationary mechanisms tied to your revenue streams\n• Growth-focused distribution supporting your 100K+ MAU target\n\nKey highlights:\n• Token-based discounts for premium subscriptions\n• Staking rewards to increase user retention\n• Governance participation for feature development\n• Phased 24-month implementation roadmap\n\nPlease review and let me know if you'd like any adjustments to the strategy or additional analysis.\n\nBest regards,\nTokenomics Strategy Team",
        output: "Response 200: 📨 email sent!",
      },
      {
        id: "notion_update_block",
        type: "make",
        blockNumber: 11,
        webhookUrl: "https://hook.make.com/notion-pipeline-update",
        parameters: [
          {
            key: "client_name",
            value: "Project XYZ - Alex",
          },
          {
            key: "status",
            value: "white paper draft sent to prospect",
          },
          {
            key: "project_type",
            value: "tokenomics strategy",
          },
          {
            key: "deliverables",
            value: "token distribution chart, white paper draft",
          },
        ],
        output:
          "✅ Notion board updated: White paper draft sent to Project XYZ prospect",
      },
    ],
  },
];

# RyesVP - Product Brief

## The Problem

Finding great events in Austin is easy. Going to them with friends is hard.

Today, discovering events means bouncing between venue websites, Ticketmaster, Facebook events, and group chats. Even when you find something interesting, coordinating with friends is fragmented across text messages, email threads, and social media. You might miss events your friends are attending, or struggle to find common availability across busy schedules.

**The core challenge:** There's no single place that combines event discovery with the social coordination needed to actually attend events together.

---

## Our Solution

**RyesVP** is a social event discovery platform that makes it easy to find events and go together. We automatically aggregate events from Austin's top venues, then layer on social features that help you discover what friends are attending and coordinate group outings.

### Core Value Proposition

1. **Automated Discovery** - We scrape and aggregate events from major Austin venues (Moody Center, Paramount Theatre, ACL Live, Stubb's BBQ, and more) so you don't have to visit multiple websites.

2. **Social Discovery** - See what events your friends are going to, discover events through your communities, and get invited to events by friends.

3. **Easy Coordination** - Mark events you're interested in, share them with friends or groups, and coordinate attendance all in one place.

---

## Key Features

### Event Discovery & Browsing

- **Comprehensive Calendar** - Browse upcoming events across Austin venues, automatically updated daily
- **Smart Filtering** - Filter by venue, date range, category (concerts, comedy, theater, sports), or social signals
- **Rich Event Details** - Each event includes venue info, date/time, ticket links, and descriptions
- **"New Listings" Highlights** - Visual badges show newly added events, especially those with presales or early access
- **"New to You" Personalization** - See events added since your last visit, making it easy to catch up on what's new
- **Dynamic Event Cards** - Visual indicators for presales, friends going, and trending events

### Social Layer

**Friends & Following**
- Build your network by connecting with friends
- See what events your friends are attending
- **Friends of Friends Discovery** - Discover events where friends of friends are going, creating opportunities to link up with mutual connections at shows
- Filter events to show only those where friends are going
- Search for friends by email to send connection requests
- Privacy controls let you choose who can see your event attendance

**Groups & Communities**
- **Invite-Only Communities** - Create private groups where members must be invited (e.g., "College Friends", "Neighborhood Crew", "Music Industry Peeps")
- Groups maintain a chill, trusted atmosphere through controlled membership
- See events where group members are attending
- Filter events by specific groups you belong to
- Group admins can manage membership and maintain community standards
- **Self-Moderation** (future) - Community-driven moderation tools allow groups to self-govern, report issues, and maintain positive vibes

**Event Sharing & Invitations**
- Share events with friends or groups with a single click
- Send personalized invitations with optional messages
- Accept invitations to automatically mark yourself as "Going"
- See who's been invited to events you're attending
- **Mutual Friend Notifications** - Get notified when friends of friends are going to events you're interested in, making it easy to connect

**Event Discussions**
- Comment on events to coordinate with friends
- Threaded discussions help organize conversations
- See what others are saying before you commit
- **Coordination Features** - Use comments to plan meetups, share ride info, or coordinate pre/post-event activities

### User Experience

- **Simple Status Tracking** - Mark events as "Going", "Interested", or "Not Going"
- **Personal Comments** - Add notes like seat numbers or meeting spots
- **Profile Page** - View all events you're attending or interested in
- **Mobile-Friendly** - Works seamlessly on phones and tablets
- **Smart Highlighting** - Events are visually distinguished based on newness, presales, and social signals

### Data Enrichment

- **Artist Information** - Events automatically include artist bios, genres, and links to Spotify and YouTube
- **Music Discovery** - One-click access to listen to artists on Spotify or watch videos on YouTube
- **Event Context** - Additional notes about tours, special events, and venue details
- **Related Events** - Discover similar events based on artist, genre, or friends' interests

---

## Target Users

**Primary:** Social event-goers in Austin who want to discover events and attend with friends

**Use Cases:**
- "I want to see what concerts my friends are going to this month"
- "My friend group wants to find a comedy show we can all attend together"
- "I'm looking for events in my community group"
- "I found a great show and want to invite my friends"

---

## How It Works

### For Event Discovery

1. **Automated Aggregation** - Our system scrapes event data from major Austin venues daily
2. **Normalization** - Events are standardized into a consistent format with venue, date, time, category, and ticket links
3. **Deduplication** - Smart matching ensures the same event from multiple sources appears only once
4. **Continuous Updates** - New events appear automatically, cancelled events are marked accordingly

### For Social Coordination

1. **Connect** - Add friends by searching their email or accept friend requests
2. **Join Communities** - Discover public groups or create private ones for your friend circles
3. **Discover** - Browse events filtered by what friends or groups are attending
4. **Share & Invite** - Share interesting events with friends or groups, send invitations
5. **Coordinate** - Use comments and status updates to plan attendance together

---

## Technical Foundation

**Platform:** Next.js web application hosted on Vercel, accessible on any device with a browser

**Data:** PostgreSQL database hosted on Supabase, ensuring reliability and scalability

**Authentication:** Secure user accounts via Supabase Auth (Google OAuth and email magic links)

**Architecture:** Serverless functions handle event ingestion, API requests, and background jobs automatically

**Privacy:** Users control who sees their events and can manage friend connections and group memberships

---

## Current Status

**MVP Complete:**
- ✅ Event aggregation from 4 major Austin venues (238+ events)
- ✅ User authentication and profiles
- ✅ Basic social features (marking attendance, comments)
- ✅ Event browsing and filtering
- ✅ Production deployment on Vercel

**In Development:**
- 🔄 Friends and following system
- 🔄 Groups and communities
- 🔄 Event invitations and sharing
- 🔄 Enhanced social filtering

---

## Vision

RyesVP aims to become the go-to platform for social event discovery in Austin. By combining automated event aggregation with social coordination features, we're building a product that solves both halves of the problem: finding great events and going to them with the right people.

**Future Possibilities:**
- Expand to other cities
- Integrate with ticketing platforms for seamless ticket purchasing
- Add calendar integrations (Google Calendar, iCal export)
- Push notifications for events friends are attending
- Artist/performer following and recommendations
- Price tracking and alerts
- **Community Self-Moderation** - Tools for groups to self-govern, report issues, and maintain positive community standards
- **Smart Social Discovery** - AI-powered suggestions for events based on friend networks and group interests

---

## Success Metrics

- **Engagement:** Users regularly check events and mark attendance
- **Social Growth:** Users add friends and join groups
- **Coordination:** Events with multiple friends attending
- **Discovery:** Users find events through social signals (friends/groups) vs. browsing

---

**Last Updated:** January 2025  
**Status:** MVP Live, Social Features in Development


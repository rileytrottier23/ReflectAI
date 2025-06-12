import { db } from './server/db.js';
import { journalEntries } from './shared/schema.js';

const entries = [
  {
    "date": "2025-01-24",
    "happiness": 9,
    "content": "Have been very slow to restart this journal this year. Mostly because I got a new computer and screens, and it took a while to get everything set up. It's been a good start to the year so far, I'm happy with Christine, our place is in great shape, the animals are happy and work is going fine. Hopefully this year I'll get a new job and we will adopt kids, and maybe move into a house. But no matter what, my relationship is in great shape, I'm happy and healthy, and overall very lucky."
  },
  {
    "date": "2025-01-28",
    "happiness": 8,
    "content": "Job hunt continues, no progress lately. I haven't been as invested, it is simply too hard to get a remote job with a referral. I really only want to work for Workday, and maybe BCI as a back-up. If I choose BCI, then I definitely am shifting towards the sales / government route, which I would prefer not to do. Having said that, it is a job with a lot of good benefits, and I'm sure I would enjoy it enough. Things with Christine are really good, except for the adoption process moving slowly. Would like to see some more progress on that in the next few weeks, but it is mostly out of our control."
  },
  {
    "date": "2025-02-02",
    "happiness": 7,
    "content": "I applied for an Amazon job in Victoria on Friday - gave me a boost of optimism to see a job I'm well qualified for, although I know they are very competitive. Putting that brand on my resume would do a lot for my career, and would also be a nice income boost. Was in Nanaimo this past weekend playing squash - did OK, but not great. I'm not really improving a lot in the past year or two, but it's not much of a priority anymore. Christine and I haven't been having a ton of sex lately, a combination of sickness and trying to not get pregnant before Tomorrowland. The adoption process is moving really slowly, I'm hoping there is some progress soon, because right now it feels like we are just spinning our tires."
  },
  {
    "date": "2025-02-06",
    "happiness": 7,
    "content": "Christine and I are both sick. It's lame. Mostly been working, resting, and spending time with Christine, which is fun, but I miss going out and doing things. Will be good to get back to it sometime this weekend. Still no update on a new job, or adoption. A bit frustrating that some of the big things in our lives are standing still. Christine does have a job interview at SMU tomorrow, which is exciting for her! But she isn't too optimistic, it sounds like they have an internal candidate lined up. It is still a good chance for her to build a reputation there and get to know people, which can hopefully lead to a job in the future. Ultimately, she isn't that happy teaching, and need to either make her peace with it, or consider doing something different. I can sort of understand, as I don't love my job either. But at least my work is mostly lower stress, and working at home in general allows for a lot of flexibility."
  },
  {
    "date": "2025-02-08",
    "happiness": 8,
    "content": "Quietly spending time with Christine these days. Not too much going on, just happily being together and relaxing. It's nice to have this downtime, and not focusing on a lot else. We've purchased a new oven a microwave, installed some backsplash in the kitchen, got our painting and some lights, and had the door painted. Our beautiful house continues to get more beautiful, and I couldn't be happier."
  },
  {
    "date": "2025-02-17",
    "happiness": 7,
    "content": "Not sure I'm getting that much from this journal anymore. Life is good overall, not a lot of worries. I'm healthy, things are good with Christine, work is fine, Amazon is exciting, family is good - nothing to really complain about or talk about too much. I'm going to keep going for a while longer, but right now life is pretty good, not too much to reflect upon."
  },
  {
    "date": "2025-02-21",
    "happiness": 4,
    "content": "Didn't get another interview at Amazon. Wildly frustrated - I don't know what I did wrong, or if I just lost out to some better candidates. I am going to do more work before any other applications to flesh out my stories more, and do some more general practice. I have to get sharper at interviews to eventually take the next step in my career, there is no other way. I think I need to focus further on my metrics, and continue honing my LinkedIn profile. The work continues - but it is a grind. I am lucky that Christine and I are financially sound, and we really don't need new jobs. But we are both a bit unhappy at work, and would like something different, something more."
  },
  {
    "date": "2025-02-23",
    "happiness": 9,
    "content": "Had a really good day with Christine yesterday - our lives are so fun, so full of joy. I am so lucky. We always say to ourselves: \"We have such wonderful lives.\" And it's true. It's as true as anything I've ever felt in my whole life."
  },
  {
    "date": "2025-03-05",
    "happiness": 6,
    "content": "Life is pretty good. Talking to a social worker on Friday about the next steps in the adoption process - I'm excited but also a bit nervous. As we get closer to adoption becoming a reality, I wonder about how hard it will be. Raising a child with lots of problems, them maybe never calling me \"Dad\", dealing with their birth families - it might be a lot. And I wonder how it will affect Christine and I, if it will hurt our marriage. She is one of the strongest people I know, but it's still a lot of additional stress. At the same time, getting pregnant and having our own child is challenging as well. There are challenges no matter how we choose to live. I don't have cold feet - I am ready to adopt or have a biological child - but it does feel more \"real\" than it did even a few weeks ago. And I imagine that it will only get more so as we get closer."
  },
  {
    "date": "2025-03-08",
    "happiness": 8,
    "content": "One week until France! Really excited to have a long trip coming up to an amazing place. Although I am a bit nervous that we haven't gotten ski's confirmed yet. It was the one thing I needed to organize, and I don't want to mess it up. There will be some amount of figuring it out on the ground, but it does stress me out a tiny bit to not have it all sorted out. We will be fine, but would be nice to know a bit more."
  },
  {
    "date": "2025-03-10",
    "happiness": 8,
    "content": "Did my taxes yesterday - really good return for 2024! It's a good time to buy into the market, stocks are low because of Trump being a moron, which is likely to continue for the time being. It's a bit of a scary time, but I'm trying to not fixate on it too much. Christine and I are off to France in six days! Skiing in the Alps, time in Paris - should be amazing. We got some bad news about adoption on Friday. Although we are cleared to take the next step and start the educational program, they told us it will be at least two years before we can adopt a kid. Which is really longer than we want to wait. So we will focus more seriously on having biological kids - which is totally fine! But will be harder given our age and the fact that we've already had two miscarriages. So a bit of a bump in the road, but we still have time and opportunity."
  },
  {
    "date": "2025-03-21",
    "happiness": 6,
    "content": "I'm twitching more. Talking to myself more. Still picking my nose a lost. Still not able to control my desire to masturbate (although I have controlled it more- and removed watching pornography). I am not sure if my meds are working, or if I need to adjust. I would like to level out more, be able to relax a bit and be still. But it's hard for me. Maybe I need meditation again- perhaps a weekend retreat. I have reduced my need to learn, but that may be because I don't see it delivering rewards anymore. I don't know what to do about that. I still feel a bit off, and want to find a way to improve."
  },
  {
    "date": "2025-03-31",
    "happiness": 6,
    "content": "OK - so I have started to dive in much deeper on using some AI / design generators to build out my own website and perhaps a web application. I notice that when I think about it and start to work on it, I get a TON of energy. And when I am at work, my energy and focus is very low. So I think I am going to spend a lot more time doing this for a while. Christine and I have agreed to stop doing cannabis during the week (it's bad for fertility) and squash season is wrapping up, so I think that I am going to devote quite a bit of time to this. I tried this once already to no success, but now I feel more motivated, and I think the tools have gotten so much better that it will be easier. I'm going to set up a sole proprietorship so that I can track expenses and write off associated costs, and then I'm going to get to work building some basic products. I'm also going to dedicate some time during the day for this, as my work at Cubic is basically at a standstill. Plus it's so boring, and I'm not learning anything - this is really the best use of my time right now."
  },
  {
    "date": "2025-04-01",
    "happiness": 9,
    "content": "No April Fool's jokes today. Work is draining me, but I feel much more motivated in general. Starting to learn these AI tools is very cool, and I'm going to try to build my first basic app tonight! In addition to that, getting budgeting set up with Monarch Money is really satisfying, and will be even more so once Christine gets all her stuff set up so we can plan for the household. In addition, I'm going to get shifted over to Notion instead of OneNote, and am excited to see what that looks like - learn another AI tool, and also get something a bit cleaner and more useful than OneNote. It might cost be a bit more money, but in general I'm really looking forward to it. Feels like I'm really upgrading and modernizing my skills for my personal life and career. Sex has also been good lately with Christine - I think a combination of very limited pornography plus very little masturbation has basically done the trick! Feels like I've got a bunch of things going well, even if my job is not doing a lot for me."
  },
  {
    "date": "2025-04-08",
    "happiness": 2,
    "content": "Absolutely terrible week. Christine's Dad has pancreatic cancer, which is effectively a death sentence at his age and it's state. Christine is devastated, as is her whole family. On top of that, we found out we need to put down Stirling in the next few weeks. He has a lump on his spleen, and operating likely won't make a difference. He is such a wonderful dog, it will be so sad to see him go. It isn't really a total surprise - he's an old man. But it is heartbreaking all the same. And the combination of all of this has me really sad and scared. Christine won't be the same after her Dad passes away, and I probably won't either. I want to support her throughout this process, but my own grief and sadness makes it challenging. I'm drinking more, masturbating more, and generally just trying to cope. But it's a really tough period."
  },
  {
    "date": "2025-04-09",
    "happiness": 7,
    "content": "Spent some time experimenting with a few different notes apps - Monday.com, Todoist, Notion - didn't like any of them. Back to OneNote - it's simple and classic, and I don't want to use anything else. Would have been nice to eventually plug in some AI applications to analyze some of my writing and notes, but that isn't that big a deal. I spend too much time analyzing anyways, when I should spend more time just doing. Stirling seems happy and full of energy today, which is nice but also a bit sad given the news. He doesn't know what's coming, and it's our job to make his last few weeks as wonderful as possible."
  },
  {
    "date": "2025-04-10",
    "happiness": 7,
    "content": "My neck is starting to hurt from being at my computer so much. I need to figure out how to adjust my desk to stop making it happen. I launched a basic website tonight, and I also did some more work on the journaling app. It is painful, and slow, and I am very much still a beginner. But that's OK - I'm starting to get better and I'll learn more with time. I'm put aside a bit of time to do more learning on Saturday, maybe get a ChatGPT integration going. I'll keep learning and growing, and hopefully I'll be able to turn this into a real career at some point."
  },
  {
    "date": "2025-04-12",
    "happiness": 6,
    "content": "Getting back at it with more building AI tools. Feels kind of unnerving to be working on something that could one day take my job. But it's so powerful, and opens so many doors, that it is impossible not to use it. I feel a tiny bit of financial stress right now - most I've felt in a while. Combination of traveling, overspending on some things like restaurants, and the stock market being down, so I can't sell to get a bit of short term cash. I'll be fine in a month or so, but I might have to be a bit more conservative on spending until then. I'm still really optimistic about what I'm building, and think it will lead to good things, even if I'm not sure what they are yet."
  },
  {
    "date": "2025-04-16",
    "happiness": 6,
    "content": "I feel a bit of boredom these days - like my mind is going ten different directions, and none of them are quite right. I might have too many things on the go, and need to scale back. But I don't FEEL that busy, mostly because work is fairly slow. It might pick up a bit this quarter, but I'm still a bit bored. No bites on jobs lately, and not even a lot that is exciting. There were some Workday opportunities, but they were more senior than my experience so they were always a stretch. Maybe it's for the best - this gives me more time to work on building my technical skills. The challenge is being disciplined enough to work on it consistently."
  },
  {
    "date": "2025-04-17",
    "happiness": 5,
    "content": "Spent the last two days with Niels and Iva. They are nice people, but it's been a tiny bit awkward. Niels is clearly struggling with some stuff, and I find him challenging to be around. He is quite socially awkward, and it's a bit draining to be around all day. But he is a nice guy, and Iva is really close with Christine, so it will all be fine. We are off to do some shopping today, and then spend some time together tonight doing an escape room and maybe taking mushrooms. Most importantly, on Friday we are saying goodbye to Stirling, which will be really sad but also a relief in some ways. He's been struggling, and it's the right time."
  },
  {
    "date": "2025-04-20",
    "happiness": 7,
    "content": "Weekend has been good. About to go to my parents for Easter dinner with Bill and Bonnie. This will be a tough week with Stirling being put down this Friday, but I'll be OK. Christine is struggling with it a bit, but she will also be OK. It's sad, but not tragic."
  },
  {
    "date": "2025-04-26",
    "happiness": 3,
    "content": "Stirling is no longer with us. He passed peacefully, lying on the couch with a fully belly. We took him on walks, fed him lots of bacon, sausage and cheesy eggs, and then cuddled with him until the vets arrived. They were really good, gave him a sedative and treats, and he slowly went to sleep. Then they gave him the last chemical, and he passed away. No pain, no suffering, and surrounded by Christine and I, sobbing away. He lived a long and happy life, and we will miss him. Already the house feels empty without him. Talia is confused and looking for him. It's going to take a while to adjust."
  },
  {
    "date": "2025-04-27",
    "happiness": 7,
    "content": "Feeling a bit frustrated with Christine. I feel like I am doing a lot more around the house than she is again, which is a recurring frustration I have every few months. I know that she does do stuff, but it always seems like a bit less than I am. The problem is, the last few times I have told her my feelings, I have gotten frustrated and hurt her, which then leads to her crying and my apologizing. I want to communicate it in a more productive way, which I might try in a bit. We rarely fight, so when we do it feels like a big deal. But it's probably healthy to have some conflict every now and then."
  },
  {
    "date": "2025-04-28",
    "happiness": 7,
    "content": "Work was slow today. We finish Adolescence - which was pretty horrifying. It's easy to see how a young person could get radicalized. If Christine and I ever have children, we will have to be very aware of their online activity. Ideally, they won't even be able to get on social media until they are 16. Still working on this AI stuff, and it's really challenging to get anything actually deployed. I can't believe it is this hard to get things live. I am stubborn and really want something to actually work, so I'll keep going. But it's a lot more challenging than I expected."
  },
  {
    "date": "2025-05-02",
    "happiness": 7,
    "content": "Christine is really struggling. She is back in Ontario seeing her sisters and Dad, who is in the hospital right now. He is potentially there for the next few months until he can have his surgery, and it sounds like the diagnosis is not promising. She also missed Stirling (so do I) and compounding that with Liam committing suicide in March, it's been a rough month or two. I want to keep supporting her, but sometimes I don't know how. I can't tell her everything will be OK, because it probably won't. Her Dad is likely going to die, and there isn't anything I can do about it. I just need to be present and supportive, and not try to fix anything."
  },
  {
    "date": "2025-05-03",
    "happiness": 8,
    "content": "Christine is still away, and I miss her. I know she is really struggling with her Dad - it is possible she has seen him for the last time. Her family situation is complicated, and I really feel for her. The reality is, things will just be hard for a while. While she's been gone, I've continued to work with AI tools, with some amount of success! I am slowly getting better and better results, although the tools are still quite buggy, and it is quite a slog. But I can see the future where this becomes much easier, and I'll be ready when it does. I'm also excited to get back to Christine and support her through this difficult time."
  },
  {
    "date": "2025-05-10",
    "happiness": 7,
    "content": "Still making lots of progress on AI stuff. It feels good to be productive, learning a new modern skill, and starting to build up the tools I would need to maybe start a business or get a high-paying new role. Life is otherwise pretty good. Christine has been frustrated with some of the communication around her family, which has been tough. I'm struggling a  bit with wanting to support her, but also feeling like she is complaining a lot and not taking action to fix things. There is probably not a lot she CAN do to fix things, but it's still frustrating to hear about the same problems over and over again. I need to be more patient and supportive."
  },
  {
    "date": "2025-05-11",
    "happiness": 7,
    "content": "Been absolutely exhausted in the mornings lately. No idea why - I'm just really tired when I get up, and I'm a bit slow to start my day. I also have woken up early a few times and have not been able to fall back asleep. I'm not sure why - I'm going to bed early, I'm taking my sleeping meds, I'm using my mouthguard, ear plugs, face mask etc. Some of it might be the cats fighting, some might be some general stress (although I don't feel too stressed in general) or maybe just a change in my sleep patterns as I get older. I'm going to try to be more consistent with my sleep schedule and see if that helps."
  },
  {
    "date": "2025-05-16",
    "happiness": 9,
    "content": "This is my first \"Real\" entry in this journal - after a ton of frustration and experimentation, I finally have this tool live! It is awesome to see and hopefully to use. I can see a few more bugs, but otherwise it's all good. I turned 36 on Wednesday - don't really feel any older. Life goes on once you hit your 30's, you measure things in terms of what happens in your life, not how many days have gone by. Christine and I are in a good place. Celebrating my birthday with her tonight, and then out with friends tomorrow night. Continuing to really invest in AI development and networking, hopefully it will lead to a new job soon. I know Workday has some more postings coming online, maybe some of those will work out for me."
  },
  {
    "date": "2025-05-20",
    "happiness": 9,
    "content": "Had a really nice long (birthday!) weekend with friends. And more importantly, a ton of time with Christine, which was fantastic. Lots of board games, sex, some mild drug use, really good food, and a bit of exercise here and there. There is also a very good chance she is pregnant, which would be the best news of the year! I am trying not to get too excited, because it is so early and there is still a ton that could go wrong. But there is some hope again, which feels wonderful. We've booked a trip to go back out east to see Charles and Joan, and Charles seems to be on a positive track in general, which is awesome. I am still digging pretty deep on these AI tools, and it feels really good. I am getting better and better, and have developed several different applications now, with more on the way."
  },
  {
    "date": "2025-05-21",
    "happiness": 7,
    "content": "Having some trouble with low energy in the morning lately. I am going to bed at a reasonable hour, not really using alcohol or drugs very often, and exercising fairly regularly. But I'm having trouble getting up in the morning. I'm also lying on my stomach a lot, which hurts my back and leads me to be more likely to masturbate first thing in the morning. I need to get back into some better morning habits. Josh and Kristi are in a really rough patch, he has been lying to her about his porn use for months now, and it seems like she is at the end of her rope. I think there is a good chance they divorce, which would be awful - or maybe not? Maybe separating would force them both to work on their issues (mostly Josh, but Kristi has some challenges as well) and they could eventually each find a partner that would be a better match. Short term though, even in the best case scenario things are way harder."
  },
  {
    "date": "2025-05-22",
    "happiness": 8,
    "content": "Work has been a bit slower lately - waiting on Mike for a lot of stuff. I'm basically at peace with it, the work is what it is. Hopefully there'll be some new Workday postings soon so I can try to transition out. I've been playing quite a bit of chess lately - and I'm getting pretty good! I tend to rush a bit (classic Riley!) and not always see checkmate moves when they're coming. But I'm really enjoying it, and I'm learning a lot in general. I'd love to be able to teach my kids how to play one day, I think it is really good for brain development and logic."
  },
  {
    "date": "2025-05-23",
    "happiness": 8,
    "content": "Start of the weekend, and looking forward to it. Got plenty of plans, but they're all fun ones. Squash, seeing my parents after they've been away for a few weeks, double date with Edith and Mike, and some spike ball with the guys on Sunday. There is a very very good chance that Christine is pregnant, which is really exciting! But it is so early, so I am still a bit hesitant to get too excited. I'll feel more excited in a few weeks once it is more likely this one sticks, the risks are still very high early on. But it would be amazing to have our first baby next year, and I'm optimistic that it'll happen."
  }
];

const userId = 4; // riley.a.trottier@gmail.com user ID

async function importEntries() {
  try {
    for (const entry of entries) {
      const insertData = {
        userId,
        date: entry.date,
        content: entry.content,
        happiness: entry.happiness
      };
      
      await db.insert(journalEntries).values(insertData);
      console.log(`Imported entry for ${entry.date}`);
    }
    console.log(`Successfully imported ${entries.length} entries`);
  } catch (error) {
    console.error('Error importing entries:', error);
  }
}

importEntries();
<div align="center">

# 🏠 dsh-team-rooms
- **1024 स्टोर चैनल**: एक बार `npm i -g dsh1024` चलाएँ, फिर `dsh1024 plugin --profile web add dsh-team-rooms` (यह [deepseek1024.com](https://deepseek1024.com) की इंस्टॉल रैंकिंग में गिना जाता है)।

**DeepSeek Harness के लिए टिकाऊ, क्रॉस-सेशन मल्टी-एजेंट टीम रूम — सदस्य, एक संदेश बस, एक साझा कार्य बोर्ड और एक साझा टाइमलाइन, जो रीस्टार्ट के बाद भी बचे रहते हैं।**

*हर सदस्य एक स्वतंत्र DSH सेशन है; रूम उनके बीच का साझा टिकाऊ ऑब्जेक्ट है।*

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Node](https://img.shields.io/badge/node-%5E22.19%20%7C%7C%20%3E%3D24-brightgreen.svg)](#)
[![dsh-doctor](https://raw.githubusercontent.com/PerryLink/dsh-plugin-doctor/main/badges/PerryLink__dsh-team-rooms.svg)](https://github.com/PerryLink/dsh-plugin-doctor#verified-徽章)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-team-rooms)
[![CI](https://img.shields.io/github/actions/workflow/status/PerryLink/dsh-team-rooms/ci.yml?branch=main&label=CI)](https://github.com/PerryLink/dsh-team-rooms/actions)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-team-rooms?label=version)](https://github.com/PerryLink/dsh-team-rooms/releases)
[![npm version](https://img.shields.io/npm/v/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)
[![npm downloads](https://img.shields.io/npm/dm/dsh-team-rooms)](https://www.npmjs.com/package/dsh-team-rooms)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

</div>

---

> **[`dsh-background-agents`](https://github.com/PerryLink/dsh-background-agents) 0.9.6 से निकाला गया।** उस प्लगइन का बैकग्राउंड-एजेंट आधा हिस्सा (`background_agent` और पाँच `bg_*` टूल) DSH के नेटिव कंटीन्युएबल उप-एजेंट से बदल चुका है; टीम-रूम आधे का कोई नेटिव समकक्ष नहीं था, इसलिए वह अपने अलग पैकेज के रूप में यहाँ जीवित है। 0.9.6 द्वारा लिखे गए स्टोरेज डोमेन, सेशन लॉग और सेटिंग्स बिना बदलाव काम करते रहते हैं — देखें *अनुकूलता*।

## अनुकूलता

होस्ट `0.1.2-alpha.2` और उसके बाद के संस्करण सेशन इवेंट शब्दावली पर fail-closed हैं, इसलिए यह प्लगइन वहाँ अपने केवल-लॉग तथ्य इवेंट (`team-room/fact`) नहीं लिखता: तथ्य logger/पैनल चैनल पर जाते हैं और `teamRoom` प्रोजेक्शन खाली फ़ोल्ड तक घट जाता है। पुरानी rc लाइनें (जहाँ तक `0.1.1-rc.2`) `ignorable` मार्कर अनुशासन बनाए रखती हैं। क्लाइंट आधा वर्तमान क्लाइंट पैकेज इस्तेमाल करता है (`dsh-api-session-controller`, `dsh-client-ui-slots`, `dsh-client-ui-settings`, `dsh-client-locale`, `dsh-client-web`)।

**`dsh-background-agents` 0.9.6 के साथ डेटा अनुकूलता कठोर नियम है।** ये स्ट्रिंग्स 0.9.6 के साथ बाइट-दर-बाइट समान हैं और इनका नाम कभी नहीं बदलना चाहिए: स्टोरेज डोमेन `team_rooms`, प्रोजेक्शन कुंजी `teamRoom`, सेशन इवेंट प्रकार `team-room/fact`, और सेटिंग्स स्लॉट आईडी `team-rooms`। इसलिए प्लगइन बदलने पर मौजूदा प्रोफ़ाइल के रूम, सदस्य लॉग और सेटिंग्स पेज ज्यों के त्यों बने रहते हैं।

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.1.6-alpha.2` (2026-09-18 को सत्यापित; dev और रनटाइम पिन `0.1.5-rc.2`, peers `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0`) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| प्लेटफ़ॉर्म | सभी (होस्ट टूल; सेटिंग्स पेज के लिए Web क्लाइंट आधा और स्टोरेज-डोमेन क्षमता चाहिए) |
| मॉडल | कोई भी (रूम कोई मॉडल रूट नहीं रखते — सदस्य साधारण सेशन हैं) |

## आपको क्या मिलता है

`dsh-team-rooms` कई स्वतंत्र सेशन को एक समन्वित टीम बना देता है:

1. **`/room` कमांड परिवार** — `create`, `join`, `leave`, `list`, `send`, `tasks`, `task add|assign|claim|done|delete`। रूम का नाम और स्वामी होता है, और उन्हें एक स्थिर रूम आईडी से संबोधित किया जाता है जिसे आप दूसरे सेशन में पेस्ट कर सकते हैं।
2. **आठ `room_*` टूल** — `room_list_rooms`, `room_post`, `room_read`, `room_list_tasks`, `room_create_task`, `room_claim_task`, `room_transfer_task`, `room_complete_task`। मॉडल अपने ही सेशन से साझा बोर्ड और बस पर काम करता है; `room_transfer_task` सदस्यों के बीच हस्तांतरण से पहले अनुमोदन माँगता है।
3. **टिकाऊ रूम स्टोर** — सदस्य, संदेश बस (निर्देशित या ब्रॉडकास्ट), कार्य बोर्ड और टाइमलाइन `team_rooms` स्टोरेज डोमेन में रहते हैं (SQLite या JSONL बैकएंड — तय डिप्लॉयमेंट करता है; प्लगइन कोई अतिरिक्त सेवा नहीं जोड़ता) और DSH रीस्टार्ट के बाद बहाल हो जाते हैं।
4. **Web सेटिंग्स पेज** — Team Rooms सेक्शन वर्तमान सेशन के हर रूम के सदस्य स्टेटस, कार्य बोर्ड और टाइमलाइन दिखाता है: पढ़ता `teamRoom` सेशन प्रोजेक्शन से है, और लिखता होस्ट `/room` कमांड से है।

## त्वरित शुरुआत

```sh
# 1. अपने प्रोफ़ाइल में बंडल इंस्टॉल करें
dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"

# या npm से (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-team-rooms

# 2. पुनः प्रारंभ करें और पंक्ति सत्यापित करें
dsh --profile web --dump-config | grep -A4 'id: team-rooms'
```

बंडल पैच में प्लगइन पंक्ति होती है; कोई Config कुंजी अनिवार्य नहीं है। रिपॉज़िटरी अपना बिल्ड आउटपुट (`lib/`) कमिट करती है, इसलिए git इंस्टॉल को बिल्ड चरण की ज़रूरत नहीं। रूम वहाँ माउंट होते हैं जहाँ स्टोरेज डोमेन संयोजित हो (`@deepseek-ai/dsh-storage-domain`, हर `@deepseek-ai/dsh-base` प्रोफ़ाइल में मौजूद); उसके बिना `/room` कमांड और `room_*` टूल सुप्त रहते हैं और बाकी सब सामान्य रूप से लोड होता रहता है।

फिर किसी भी सेशन में:

```
/room create release-prep
/room send <roomId> kickoff: I own the changelog, who takes the docs?
/room task add <roomId> draft the migration note
/room task claim <roomId> <taskId>
```

छपी हुई रूम आईडी को दूसरे सेशन में पेस्ट करें और `/room join <roomId>` चलाएँ — वह सेशन अब सदस्य है, रूम की डिलीवरी साधारण संदेशों की तरह पाता है, और वही बोर्ड देखता है।

## इंस्टॉल और अनइंस्टॉल

- **git चैनल** (नवीनतम `main`): `dsh plugin --profile web add "github:PerryLink/dsh-team-rooms#main"` — `lib/` कमिटेड, कोई `prepare` या `allowBuilds` चरण नहीं।
- **npm चैनल** (प्रकाशित रिलीज़): `dsh plugin --profile web add dsh-team-rooms`।
- **tarball चैनल**: इस रिपॉज़िटरी में `pnpm pack`, फिर `dsh plugin --profile web add ./dsh-team-rooms-<version>.tgz`।
- **अनइंस्टॉल**: `dsh plugin --profile web remove dsh-team-rooms` (या प्रोफ़ाइल पैच से पंक्ति हटाएँ)। आपके रूम `team_rooms` स्टोरेज डोमेन में बने रहते हैं और दोबारा इंस्टॉल करने पर लौट आते हैं।
- ⚠️ **इसे और `dsh-background-agents` को एक साथ माउंट न करें।** डेप्रिकेशन विंडो के दौरान दोनों प्रकाशित हैं, और दोनों वही आठ `room_*` टूल, वही `settings.section` स्लॉट id (`team-rooms`) और वही `team_rooms` स्टोरेज डोमेन रजिस्टर करते हैं — इसलिए दोनों रूम हिस्से टकराते हैं। यदि आप पहले से `dsh-background-agents` चला रहे हैं, तो पहले उसे हटाएँ (`dsh plugin --profile web remove dsh-background-agents`)। किसी भी स्थिति में आपके रूम सुरक्षित रहते हैं: वे स्टोरेज डोमेन में रहते हैं, प्लगइन में नहीं।

## कॉन्फ़िगरेशन

हर ट्यूनेबल एक सत्यापित Schemastery `Config` फ़ील्ड है — इसे cordis.yml में बदलें, कोड में कभी नहीं। कोई भी अनिवार्य नहीं है।

| कुंजी | डिफ़ॉल्ट | अर्थ |
|---|---|---|
| `maxRooms` | `16` | पूरे प्रोफ़ाइल में टीम रूम की कठोर सीमा |
| `maxMembersPerRoom` | `8` | प्रति रूम सदस्यों की कठोर सीमा (`>= 2`) |
| `maxRoomsPerMember` | `4` | एक सदस्य सेशन कितने रूम जॉइन कर सकता है |
| `busRetention` | `200` | प्रति रूम रखे गए बस संदेश |
| `timelineRetention` | `500` | प्रति रूम रखे गए टाइमलाइन इवेंट |
| `taskRetention` | `50` | प्रति रूम रखे गए पूर्ण कार्य |
| `maxMessageChars` | `4000` | एक रूम संदेश के टेक्स्ट की कठोर सीमा (अधिक होने पर अस्वीकार, कभी काटा नहीं जाता) |
| `injectRoomBrief` | `true` | सदस्य सेशन में संक्षिप्त रूम ब्रीफ़ इंजेक्ट करें (जॉइन + रिज़्यूम पर) |
| `roomOpenTimeoutMs` | `15000` | `team_rooms` स्टोरेज-डोमेन खुलने में कितना समय लग सकता है, इसके बाद हर रूम ऑपरेशन स्पष्ट रूप से (`store-unavailable`) विफल होता है, लटकता नहीं |
| `allowUnmarkedFacts` | `false` | जिन होस्ट पर `ignorable` मार्कर छूट जाता है वहाँ केवल-लॉग `team-room/fact` इवेंट ज़बरदस्ती लिखें (खतरनाक: बिना मार्कर वाले तथ्य सेशन को दूसरे होस्ट पर अपुनरुद्ध कर देते हैं); डिफ़ॉल्ट पहचान कर छोड़ देता है |
| `inbound.enabled` | `false` | बाहरी एजेंट रनटाइम (OpenAI Agents SDK / CrewAI) के लिए stdio JSON-RPC इनबाउंड ब्रिज सक्षम करें। डिफ़ॉल्ट रूप से बंद (fail-closed)। |
| `inbound.command` | *(कोई नहीं)* | बाहरी रनटाइम लॉन्च कमांड; सक्षम और मौजूद होने पर प्लगइन उसे spawn करता है और नई-पंक्ति-सीमित JSON-RPC सूचनाएँ सुनता है। अनुपस्थित/spawn न हो पाने पर = ब्रिज सुप्त रहता है (लॉग होता है)। |

## उपकरण और सतहें

| सतह | प्रकार | टिप्पणियाँ |
|---|---|---|
| `/room` | command | `create\|join\|leave\|list\|send\|tasks\|task add\|assign\|claim\|done\|delete` |
| `room_list_rooms` | tool | इस सेशन के हर रूम: आईडी, नाम, सदस्य सूची, कार्य गणना |
| `room_post` | tool | बस पर पोस्ट करें (ब्रॉडकास्ट, या `to` के साथ निर्देशित) |
| `room_read` | tool | किसी रूम की बस हिस्ट्री, seq कर्सर से पढ़ें |
| `room_list_tasks` | tool | किसी रूम का साझा कार्य बोर्ड |
| `room_create_task` | tool | बोर्ड पर एक पंक्ति जोड़ें (वैकल्पिक रूप से सौंपी गई) |
| `room_claim_task` | tool | इस सेशन के लिए पंक्ति claim करें (assignee + प्रगति में) |
| `room_transfer_task` | tool | पंक्ति दूसरे सदस्य को सौंपें — **अनुमोदन-आधारित**, विफल होने पर fail-closed |
| `room_complete_task` | tool | पंक्ति को `done` चिह्नित करें |
| `teamRoom` प्रोजेक्शन | session projection | इस सदस्य के अपने लॉग में `team-room/fact` इवेंट से फ़ोल्ड किया गया रूम दृश्य |
| Web सेटिंग्स पेज | client | सदस्य स्टेटस, कार्य बोर्ड, टाइमलाइन और रूम क्रियाएँ; स्लॉट आईडी `team-rooms` |

ये **आठ** `room_*` टूल हैं, और स्टोरेज डोमेन संयोजित होने पर सभी पंजीकृत होते हैं।

## यह कैसे काम करता है — और रीस्टार्ट के बाद क्यों बचा रहता है

रूम स्टोर क्रॉस-सेशन प्राधिकारी है; सेशन प्रोजेक्शन हर सदस्य की अपनी पुनर्निर्मित प्रति है। दो प्रकार की लेखन एक साथ चलती हैं और सुसंगत रहती हैं:

- **हर रूम परिवर्तन** (create, join, leave, post, कार्य संक्रमण) एक ही hub राइट चेन पर कतार में लगता है — `team_rooms` डोमेन की एकमात्र राइट चेन ही क्रम-प्राधिकारी है, इसलिए समवर्ती पोस्टर कभी read-modify-write को इंटरलीव नहीं कर सकते और बस seq कड़ाई से कमिट क्रम में बनते हैं।
- **मॉडल-दृश्य ⟺ दर्ज**: डिलीवर किया गया रूम संदेश आधिकारिक इनबॉक्स डिलीवरी है (`agent.followup` जीवित सदस्य को जगाता है; `agent.inject` ऑफ़लाइन सदस्य को अगली शुरुआत पर उसका बैकलॉग देता है), इसलिए वह उस सदस्य के अपने सेशन लॉग में टिकाऊ `user/message` के रूप में दर्ज होता है।
- **साझा टाइमलाइन** हर सदस्य के लॉग में केवल-लॉग `team-room/fact` इवेंट के रूप में प्रतिबिंबित होती है, जो कैनोनिकल स्टोर `timelineSeq` लेकर चलते हैं; `teamRoom` प्रोजेक्शन हर सदस्य के अपने लॉग को फ़ोल्ड करता है, इसलिए हर पुनः-खोलने पर दृश्य स्टोर पढ़े बिना फिर से बन जाता है।
- **डिलीवरी at-least-once और क्रमबद्ध है**: प्रति-सदस्य कर्सर (`lastDeliveredSeq`, `lastFactSeq`) केवल डिलीवरी पहुँचने के बाद बढ़ते हैं, इसलिए कमिट और डिलीवरी के बीच क्रैश होने पर कैच-अप में दोबारा डिलीवरी होती है, संदेश खोता नहीं।

जिन होस्ट का `Session.append` `ignorable` मार्कर से पुराना है (सभी प्रकाशित rc लाइनें `0.1.0-rc.8` तक, `0.1.1-rc.2` लाइन, और `0.1.2-rc` लाइन, जो एनवलप फ़ील्ड केवल पहले से सहेजे लॉग पढ़ने की संगति के लिए रखती है) उन्हें पहले append से पहले पहचान लिया जाता है (peer-संस्करण पूर्व-जाँच, फिर लौटाए गए एनवलप की जाँच) और तथ्य-लेखन एक बार की चेतावनी के साथ छोड़ दिया जाता है: टिकाऊ स्टोर, API सतहें और मॉडल-दृश्य डिलीवरी सामान्य रूप से काम करती रहती हैं, और `teamRoom` खाली फ़ोल्ड तक घट जाता है। `allowUnmarkedFacts: true` लेखन फिर चालू कर देता है — जान-बूझकर खतरनाक।

## यह प्लगइन नहीं है

| प्रोजेक्ट | यह क्या करता है | सीमा |
|---|---|---|
| [titanwings/dsh-automation](https://github.com/titanwings/dsh-automation) | नए एजेंट सेशन में शेड्यूल किए गए कोडिंग कार्य | यह तय करता है कि कार्य **कब** चलें (शेड्यूलिंग)। यह प्लगइन उस **साझा ऑब्जेक्ट** का स्वामी है जिस पर कई सेशन काम करते हैं — कोई शेड्यूलर सीम नहीं, कोई cron नहीं। |
| [YYTbit/dsh-plugin-agent-dashboard](https://github.com/YYTbit/dsh-plugin-agent-dashboard) | मल्टी-एजेंट डैशबोर्ड स्किल | प्रदर्शन-केंद्रित और मुख्यतः पठन। इस प्लगइन के रूम **लिखने योग्य समन्वय-स्थिति** हैं: एक बस, एक बोर्ड, और अनुमोदन-आधारित हस्तांतरण, जो harness के अपने स्टोरेज में टिकाऊ हैं। |
| `dsh-background-agents` | बैकग्राउंड एजेंट और (पहले) टीम रूम | उस पैकेज का `bg_*` आधा DSH के नेटिव कंटीन्युएबल उप-एजेंट से बदल चुका है; उसका रूम आधा यह पैकेज है। दोनों रूम आधे एक साथ माउंट न करें। |

## अनुमतियाँ और डेटा

- **अनुमतियाँ**: workshop मैनिफ़ेस्ट `session:append` और `tools:register` घोषित करता है। रूम कभी उप-एजेंट spawn नहीं करते, इसलिए प्लगइन कोई `subagent:*` अनुमति नहीं माँगता और कोई उप-एजेंट निर्भरता घोषित नहीं करता।
- **डेटा**: रूम `team_rooms` स्टोरेज डोमेन में रहते हैं (SQLite या JSONL — शून्य अतिरिक्त सेवाएँ)। कोई अलग डेटाबेस नहीं, कोई नेटवर्क नहीं।
- **सेशन लॉग**: `team-room/fact` इवेंट उन होस्ट पर एनवलप के `ignorable: true` मार्कर के साथ जोड़े जाते हैं जो उसका सम्मान करते हैं (मार्कर-पूर्व होस्ट पहचाने जाते हैं और तथ्य-लेखन छोड़ दिया जाता है — देखें `allowUnmarkedFacts`); मॉडल-दृश्य रूम डिलीवरी असली `user/message` रिकॉर्ड हैं।

## सुरक्षा सीमाएँ

- **अनुमोदन-आधारित हस्तांतरण।** `room_transfer_task` आधिकारिक अनुमोदन सीम से जाता है और अनुमोदन सेवा संयोजित न होने या कोई अनुमति न देने पर fail-closed होता है — मना करने पर कुछ नहीं बदलता।
- **मॉडल-दृश्य ⟺ दर्ज।** हर डिलीवर किया गया रूम संदेश सदस्य के अपने लॉग में टिकाऊ `user/message` है; साझा टाइमलाइन केवल-लॉग `team-room/fact` इवेंट के रूप में प्रतिबिंबित होती है। रूम संदेश दर्ज हुए बिना मॉडल तक पहुँच ही नहीं सकता।
- **सदस्यता ही प्राधिकरण सीमा है।** हर `room_*` टूल कॉल करने वाले सेशन की अपनी सदस्यता के आधार पर प्राधिकृत करता है; गैर-सदस्य को स्थिर अस्वीकृति मिलती है, आधा-अधूरा लेखन नहीं।
- **प्रतिधारण सीमित है।** बस, टाइमलाइन और पूर्ण कार्यों की विंडो हर लेखन पर लागू होती हैं, इसलिए दीर्घजीवी रूम असीमित नहीं बढ़ सकता।
- **कोई शेड्यूलिंग नहीं, कोई क्रॉस-मशीन सदस्य नहीं।** सदस्य इस डिप्लॉयमेंट के प्रोसेस-स्थानीय सेशन हैं।

## क्रॉस-इकोसिस्टम इनबाउंड (P2)

बाहरी एजेंट रनटाइम — OpenAI Agents SDK, CrewAI और समान — एक न्यूनतम **stdio नई-पंक्ति-सीमित JSON-RPC 2.0 ब्रिज** के ज़रिए टीम रूम में प्रकाशित कर सकते हैं। यह JSON-RPC डायरेक्ट-कनेक्ट न्यूनतम सेट है, आधिकारिक ACP वायर प्रोटोकॉल नहीं: पूर्ण ACP अनुकूलता अपस्ट्रीम सीम की प्रतीक्षा में है।

इसे दो Config फ़ील्ड से सक्षम करें और `inbound.command` को ऐसे लॉन्चर पर इंगित करें जो stdout पर प्रति पंक्ति एक JSON सूचना देता हो:

```yaml
# cordis.yml (प्लगइन पंक्ति)
inbound:
  enabled: true
  command: "python external_runtime.py --room <room-id>"
```

रनटाइम तीन प्रकार की सूचनाएँ देता है; `method` इवेंट नाम है और `params.name` बाहरी एजेंट का प्रदर्शन नाम:

```json
{"jsonrpc":"2.0","method":"agent_started","params":{"name":"researcher","room":"<room-id>","traceId":"t-1"}}
{"jsonrpc":"2.0","method":"agent_message","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","message":"found the failing test"}}
{"jsonrpc":"2.0","method":"agent_finished","params":{"name":"researcher","room":"<room-id>","traceId":"t-1","status":"ok","usage":{"inputTokens":100,"outputTokens":40}}}
```

हर एक रूम की मौजूदा सतहों पर मैप होती है: `agent_started` कार्य बोर्ड पर कार्ड खोलती है, `agent_message` संदेश बस पर पोस्ट करती है, और `agent_finished` कार्ड बंद कर परिणाम पोस्ट करती है। अमान्य संदेश fail-closed होते हैं — वे छोड़ दिए जाते हैं और stdin पर JSON-RPC त्रुटि लिखी जाती है। बाहरी रनटाइम DSH सेशन नहीं हैं, इसलिए रूम के स्वामी सदस्य का सेशन प्रेषक बनता है; बिना स्वामी सदस्य वाला रूम इवेंट छोड़ देता है। शुरू और बंद प्लगइन फ़ाइबर के disposer के स्वामित्व में हैं; spawn न हो पाने वाला `inbound.command` एक लॉग चेतावनी तक सिमट जाता है (ब्रिज सुप्त रहता है, बाकी कुछ प्रभावित नहीं होता)।

## ज्ञात सीमाएँ

- रूम के लिए स्टोरेज डोमेन संयोजित होना ज़रूरी है; `@deepseek-ai/dsh-storage-domain` के बिना `/room` कमांड और `room_*` टूल अक्षम रहते हैं।
- रूम तब सार्थक होता है जब उसमें कम से कम दो सदस्य हों, और सदस्य सूची `maxMembersPerRoom` से सीमित है; सदस्यता प्रति सेशन है, प्रति उपयोगकर्ता नहीं।
- क्रॉस-मशीन सदस्यता नहीं है: हर सदस्य इस डिप्लॉयमेंट का प्रोसेस-स्थानीय सेशन है।
- `room_transfer_task` को अनुमोदन उत्तरदाता चाहिए। उसके बिना यह डिज़ाइन से fail-closed है, इसलिए स्वचालित हस्तांतरण चाहने वाली प्रोफ़ाइल को अनुमोदन सेवा संयोजित करनी होगी।
- लागत/उपयोग लेखांकन यहाँ क्षेत्र से बाहर है (वह बैकग्राउंड-एजेंट आधे में था); रूम सतहें संरचना बताती हैं, खर्च नहीं।

## विकास

```sh
pnpm install        # केवल टूलिंग; harness पैकेज सहोदर checkout से हल होते हैं
pnpm run typecheck  # सख़्त TS, node + क्लाइंट दोनों प्रोग्राम
pnpm test           # vitest: यूनिट, रूम hub, प्रोजेक्शन और jsdom पैनल टेस्ट
pnpm run build      # lib/index.js (node आधा) + lib/client.js (Web क्लाइंट बंडल)
pnpm run verify:artifacts && pnpm run check:readmes
pnpm run gen-aliases  # checkout खिसकने पर harness पैकेज पथ दोबारा मैप करें
```

`pnpm run pack:smoke` बिल्ड और पैक करता है, और `DSH_HARNESS_ROOT` सेट होने पर tarball को एक अस्थायी प्रोफ़ाइल में इंस्टॉल कर संयोजित पंक्ति जाँचता है।

## विषय

`dsh`, `dsh-plugin`, `deepseek-harness`, `team-rooms`, `multi-agent`, `message-bus`, `task-board`, `collaboration`, `cross-session`

## योगदानकर्ता

- [@PerryLink](https://github.com/PerryLink) — निर्माता और अनुरक्षक: टीम-रूम hub और उसकी राइट चेन, डिलीवरी कर्सर, `teamRoom` प्रोजेक्शन, Web सेटिंग्स पेज, दस्तावेज़, CI/CD और रिलीज़।

## PerryLink DSH प्लगइन परिवार

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [41 DeepSeek Harness प्लगइन](https://github.com/PerryLink) में से एक है। अगर यह उपयोगी लगा, तो बाकी भी लगेंगे:

| प्लगइन | एक पंक्ति |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | अनुमोदन श्रृंखला पर दूसरे मॉडल का ऑटो-रिव्यू, डिफ़ॉल्ट से fail-closed | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | DeepSeek Harness के लिए लागत शासन: बजट, कार्बन और विलंबता एक पैनल में | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind के समकक्ष: स्नैपशॉट, सेशन फ़ोर्क, एक-चरण बहाली | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Claude Code के सेशन, मेमोरी, स्किल और CLAUDE.md को DSH में माइग्रेट करें | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | DeepSeek Harness के लिए क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण — पहले Windows | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Web कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर, Ctrl+R खोज | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | डेटासेट गुणवत्ता जाँच और उद्धरण क्रॉस-चेक | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | DeepSeek Harness के लिए प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक रक्षा | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | इंजीनियरिंग-अनुशासन गार्ड: आवश्यकता पड़ताल, टेस्ट गेट, प्रतिपक्षी समीक्षा | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | DeepSeek Harness के लिए एकीकृत स्थिर-छवि जनरेशन रूटिंग | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | DeepSeek Harness के लिए केवल-पठन प्रदर्शन निदान | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | चीनी सार्वजनिक म्यूचुअल फंड के लिए नियतात्मक शोध रिपोर्ट | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | DSH के लिए GitHub PR/issue एकीकरण, हर लेखन अनुमोदन-आधारित | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | उद्योग शोध ऑर्केस्ट्रेशन जो अपने डिलिवरेबल इस प्लगइन के `ctx.researchReport.assemble` से सील करता है | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | DeepSeek Harness के लिए स्थानीय दस्तावेज़ ज्ञान आधार | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | DeepSeek Harness के लिए स्थानीय मॉडल (Ollama) एकीकरण | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | भाषा सर्वर पर LSP निदान, फ़ॉर्मैटिंग, पूर्णता, कोड क्रियाएँ और नाम बदलना | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII मास्किंग मिडलवेयर: मॉडल सीमा पर अनाम, प्रदर्शन परत पर बहाल | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | केवल-पठन MCP रनटाइम पैनल: /mcp कमांड + स्टेटस, टूल और त्रुटियों वाला सेटिंग्स टैब | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | अनुमोदन-आधारित क्रॉस-सेशन मेमोरी: ctx.memory सीम + SQLite + memory टूल | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | DeepSeek Harness के लिए OpenTelemetry और Langfuse ऑब्ज़र्वेबिलिटी एक्सपोर्टर | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles के समकक्ष रनटाइम शैली स्विचिंग | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-शैली घोषणात्मक allow/deny/ask अनुमति नियम, ऑडिट के साथ | |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | टॉप-बार टॉगल के साथ व्यक्तिगत निर्देश इंजेक्टर (framework संस्करण) | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | माँग पर लोड होने वाला प्लगइन-विकास ज्ञान आधार स्किल | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | मल्टी-चैनल अनुमोदन/प्रश्न ब्रिज: WeChat/Telegram/Feishu, सेशन कंसोल | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | सत्यापनीय शोध-रिपोर्ट इंजन: सामग्री-पता-युक्त प्रमाण बही और सील्ड संस्करण | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | DeepSeek Harness प्लगइन के लिए बहुआयामी गुणवत्ता स्कोरिंग | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Web साइडबार में सेशन पिन करें, टिकाऊ क्रम के साथ | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | DeepSeek Harness के लिए क्रॉस-डिवाइस सेशन सिंक — आपके सेशन स्टोर का समर्पित git मिरर | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | सुरक्षा-ऑडिट स्किल पैक: सीक्रेट स्कैन, निर्भरता और सप्लाई-चेन समीक्षा | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | DeepSeek Harness के लिए वॉइस-फ़र्स्ट सेशन लूप: बोलिए और जवाब सुनिए | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | DeepSeek Harness प्लगइन के लिए पृथक इंस्टॉल-और-स्मोक टेस्ट ड्राइव | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 कार्य ब्रिज: सेशन-हेडर पैनल + 11 टूल | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | DeepSeek Harness के लिए विक्रेता पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-kit](https://github.com/PerryLink/dsh-kit)** | One-command starter pack that installs the core family | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-portal](https://github.com/PerryLink/dsh-plugin-portal)** | Zero-dependency static portal rendering the whole plugin family as one page | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-wechat](https://github.com/PerryLink/dsh-wechat)** | WeChat ↔ DSH bridge (Tencent iLink bot) developed with [pan17](https://github.com/pan17/dsh-wechat), who hosts the repo | |

### DSH Desktop मार्केट से इंस्टॉल करें

सभी PerryLink प्लगइन अंतर्निहित DSH Desktop मार्केट में ब्राउज़ किए जा सकते हैं: **Market → Sources → add source → पेस्ट करें** `https://perrylink-dsh-catalog.perrylink.workers.dev/catalog-source.json` **→ उसे चुनें**। इंस्टॉलेशन अब भी मार्केट के npm-पहचान सत्यापन और आपकी पुष्टि से होकर जाता है।

## लाइसेंस

[Apache License 2.0](LICENSE) © 2026 dsh-team-rooms contributors

# Call-A-Taxi-TelegramBot
 
## What do you need?
A Chat with taxi drivers in your area  
A Telegram Bot token from BotFather  
A Token from [openrouteservice.org](https://openrouteservice.org/dev/#/home) to reverse the gps to an adress  
A MySQL/MariaDB server  

## How to install?
Create a database user for this bot with the permissions to creat a new DB and native_password  
clone this repositorie  
rename .env.example to .env  
modify .env  
```js
npm i
npm run db
node ./index.js
 ```

## How to get Admin permissions?
You need to be registerd with /start, then simply chance your permissions "user" to "admin" in the database.  

## How to add another language?
Create a new file in ./language  
For example fr.json for French  
Next, you need to following functions in ./src/telegram.js  
At the import:
```js
const i18n = new I18n(__dirname + '/../languages', ['en', 'de', 'tr', 'fr'], 'de');
 ```
In /start and /language event
```js
let replyMarkup = bot.inlineKeyboard([
		[
			bot.inlineButton(i18n.translate(FirstLang, 'language.de'), {callback: `${msg.from.id}_Clang_de`}),
			bot.inlineButton(i18n.translate(FirstLang, 'language.en'), {callback: `${msg.from.id}_Clang_en`})
		],[
            bot.inlineButton(i18n.translate(FirstLang, 'language.tr'), {callback: `${msg.from.id}_Clang_tr`}),
            bot.inlineButton(i18n.translate(FirstLang, 'language.fr'), {callback: `${msg.from.id}_Clang_fr`})
		]

	]);
 ```
You also need to add your new language to all other .json files in the language part  
Example for de.json since thats the fallback for this bot  
```json
    "language": {
        "de": "Deutsch",
        "en": "Englisch",
        "tr": "Türkisch",
        "fr": "Französisch"
    },
 ```
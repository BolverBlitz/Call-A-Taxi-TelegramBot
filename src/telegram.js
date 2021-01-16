require('dotenv').config();
const f = require('./lib/Funktions');
const OS = require('./lib/Hardware');
const ping = require('ping');
const package = require('../package');
const fs = require('fs');
const SQL = require('./lib/MySQL')
const { default: I18n } = require('new-i18n')
const i18n = new I18n(__dirname + '/../languages', ['en', 'de', 'tr'], 'de');
const randomstring = require('randomstring');

var openrouteservice = require("openrouteservice-js");
var Directions = new openrouteservice.Directions({
	api_key: process.env.OpenRouts_Token
});

var Geocode = new openrouteservice.Geocode({
	api_key: process.env.OpenRouts_Token
});

const Telebot = require('telebot');
const bot = new Telebot({
	token: process.env.Telegram_Bot_Token,
	limit: 1000,
        usePlugins: ['commandButton']
});

/* Permissions Groups */
const user = ["user", "fahrer", "admin"];
const fahrer = ["admin", "fahrer"];
const admin = ["admin"];

var Time_started = new Date().getTime();

function SetAdminChat(ChatID, ChatName, language) {
	return new Promise(function(resolve, reject) {
		let NewChat = {
			ChatID: ChatID,
			ChatName: ChatName,
			language: language
		}
		let NewChatJson = JSON.stringify(NewChat);
		fs.writeFile(`./adminchat.Qjson`, NewChatJson, (err) => {
			if (err) reject(new Error('File could not be written'));
			resolve("File written")
		});
	})
}

function GetAdminChat() {
	if(fs.existsSync(`./adminchat.Qjson`)){
		var AdminChatJson = JSON.parse(fs.readFileSync(`./adminchat.Qjson`));
		return {ChatID: AdminChatJson["ChatID"], ChatName: AdminChatJson["ChatName"], language: AdminChatJson["language"]}
	}else{
		return new Error('DB File does not exist')
	}
}

/*Standart funktions Start|Alive|Help*/
bot.on(/^\/alive/i, (msg) => {
	OS.Hardware.then(function(Hardware) {
		let Output = "";
		Output = Output + '\n- CPU: ' + Hardware.cpubrand + ' ' + Hardware.cpucores + 'x' + Hardware.cpuspeed + ' Ghz';
		Output = Output + '\n- Load: ' + f.Round2Dec(Hardware.load);
		Output = Output + '%\n- Memory Total: ' + f.Round2Dec(Hardware.memorytotal/1073741824) + ' GB'
		Output = Output + '\n- Memory Free: ' + f.Round2Dec(Hardware.memoryfree/1073741824) + ' GB'
		ping.promise.probe('api.telegram.org').then(function (ping) {
			msg.reply.text(`Botname: ${package.name}\nVersion: ${package.version}\nPing: ${ping.avg}ms\n\nUptime: ${f.uptime(Time_started)}\n\nSystem: ${Output}`).then(function(msg)
			{
				setTimeout(function(){
				bot.deleteMessage(msg.chat.id,msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));
				}, 25000);
            }).catch(error => console.log(error));
            bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => f.Elog('Error (deleteMessage):' + error.description));
		});
	});
});

bot.on([/^\/help/i, /^\/hilfe/i], (msg) => {
	SQL.GetUser({UserID: msg.from.id}).then(function(SQLuser) {
		var Message = [];
		if(user.includes(SQLuser[0].permissions)){
			Message.push(i18n.translate(SQLuser[0].language, 'hilfe.allgemein'));
			Message.push(i18n.translate(SQLuser[0].language, 'hilfe.user'));
			if(admin.includes(SQLuser[0].permissions)){
				Message.push(i18n.translate(SQLuser[0].language, 'hilfe.admin'));
				if(fahrer.includes(SQLuser[0].permissions)){
					Message.push(i18n.translate(SQLuser[0].language, 'hilfe.fahrer'));
				}
			}
		}else{
			Message.push(i18n.translate('en', 'hilfe.unReg'));
		}
		msg.reply.text(Message.join("\n\n"), {parseMode: 'html'}).catch(error => console.log(error));
	}).catch(error => console.log(error));
});

bot.on([/^\/license/i, /^\/lizenz/i], (msg) => {
	msg.reply.text("Made by @BolverBlitz\n\n<b>Code:</b><a href='https://www.ebg.pw/'>Github</a>\n<b>Licens:</b> AGPL-3.0\n<b>Hosted by:</b> @ebg_pw", {parseMode: 'html'}).catch(error => console.log(error));
});

bot.on([/^\/start/i], (msg) => {
	
	if ('language_code' in msg.from) {
		f.log(`User ${msg.from.id} hat sich mit ${msg.from.language_code} regestriert.`)
        if (i18n.languages.includes(msg.from.language_code)) {
			var FirstLang = msg.from.language_code
        }else{
			var FirstLang = process.env.Default_language
		}
    }else{
		f.log(`User ${msg.from.id} hat sich ohne usercode registiert.`)
		var FirstLang = process.env.Default_language
	}

	let replyMarkup = bot.inlineKeyboard([
		[
			bot.inlineButton(i18n.translate(FirstLang, 'language.de'), {callback: `${msg.from.id}_Clang_de`}),
			bot.inlineButton(i18n.translate(FirstLang, 'language.en'), {callback: `${msg.from.id}_Clang_en`})
		],[
			bot.inlineButton(i18n.translate(FirstLang, 'language.tr'), {callback: `${msg.from.id}_Clang_tr`})
		]

	]);
	msg.reply.text(i18n.translate(FirstLang, 'start.Willkommen'), {parseMode: 'html', replyMarkup}).catch(error => f.Elog('Error (SendStart):' + error.description));
});

bot.on([/^\/language/i, /^\/sprache/i], (msg) => {
	SQL.GetUserLang({UserID: msg.from.id}).then(function(lang) {
		if(Object.entries(lang).length !== 0){
			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton(i18n.translate(lang[0].language, 'language.de'), {callback: `${msg.from.id}_lang_de`}),
					bot.inlineButton(i18n.translate(lang[0].language, 'language.en'), {callback: `${msg.from.id}_lang_en`})
				],[
					bot.inlineButton(i18n.translate(lang[0].language, 'language.tr'), {callback: `${msg.from.id}_lang_tr`})
				]

			]);
			msg.reply.text(i18n.translate(lang[0].language, 'sprache.Message'), {parseMode: 'html', replyMarkup}).catch(error => f.Elog('Error (SendStart):' + error.description));
		}else{
			var Message = [];
			for (i = 0; i < i18n.languages.length; i++) {
				Message.push(i18n.translate(i18n.languages[i], 'sprache.FehlendeRegestrierung'))
			}
			msg.reply.text(Message.join("\n"), {parseMode: 'html'}).catch(error => f.Elog('Error (SendStart):' + error.description));
		}
	}).catch(error => console.log(error));
});

//AdminChat managment
bot.on([/^\/setAdminChat( .+)*$/i, /^\/setzeAdminChat( .+)*$/i], (msg, props) => {
	Promise.all([SQL.GetUserPermissions({UserID: msg.from.id}), SQL.GetUserLang({UserID: msg.from.id})]).then(function(PAll) {
		if(admin.includes(PAll[0][0].permissions)){
		var Para = props.match[1]
		if(Para){
			Para = Para.trim().toLowerCase();
			if(i18n.languages.includes(Para)){
				SetAdminChat(msg.chat.id, msg.chat.title, Para).then(function(data) {
					let Sprache = i18n.translate(PAll[1][0].language, `language.${PAll[1][0].language}`)
					msg.reply.text(i18n.translate(PAll[1][0].language, 'AdminChat.Sucsess', { language: Sprache }), {parseMode: 'html'}).catch(error => console.log(error));
				}).catch(function(error){
					console.log(error);
					msg.reply.text(i18n.translate(PAll[1][0].language, 'fehler.FileError'), {parseMode: 'html'}).catch(error => console.log(error));
				});
			}else{
				msg.reply.text(i18n.translate(PAll[1][0].language, 'fehler.SpracheNichtUnterstützt', { language: Para }), {parseMode: 'html'}).catch(error => console.log(error));
			}
		}else{
			msg.reply.text(i18n.translate(PAll[1][0].language, 'fehler.SpracheFehlt', { language: Para }), {parseMode: 'html'}).catch(error => console.log(error));
		}
	}else{
		msg.reply.text(i18n.translate(PAll[1][0].language, 'fehler.BrauchtAdmin'), {parseMode: 'html'}).catch(error => console.log(error));
	}
	}).catch(error => console.log(error));
});

bot.on([/^\/getAdminChat/i, /^\/zeigeAdminChat/i], (msg) => {
	Promise.all([SQL.GetUserPermissions({UserID: msg.from.id}), SQL.GetUserLang({UserID: msg.from.id})]).then(function(PAll) {
		if(admin.includes(PAll[0][0].permissions)){
			let AdminChatReturn = GetAdminChat()
			let languageString = i18n.translate(PAll[1][0].language, `language.${AdminChatReturn.language}`);
			msg.reply.text(i18n.translate(PAll[1][0].language, 'AdminChat.GetChat', {ChatID: AdminChatReturn.ChatID, ChatName: AdminChatReturn.ChatName, language: languageString}), {parseMode: 'html'}).catch(error => console.log(error));
		}
	});
});
//Driver Managment
bot.on([/^\/addDriver/i, /^\/addFahrer/i], (msg) => {
	SQL.GetUserLang({UserID: msg.from.id}).then(function(lang) {
		bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => console.log(error));
		if ('reply_to_message' in msg) {
			var UserID = msg.reply_to_message.from.id
			if ('username' in msg.reply_to_message.from) {
				var username = f.cleanString(msg.reply_to_message.from.username.toString());
			}else{
				var username = f.cleanString(msg.reply_to_message.from.first_name.toString());
			}
			Promise.all([SQL.GetUserPermissions({UserID: msg.from.id}), SQL.GetUserPermissions({UserID: UserID})]).then(function(PAll) {
				if(admin.includes(PAll[0][0].permissions) && PAll[1][0].permissions !== "fahrer"){
					if(PAll[1][0].permissions !== "admin"){
						SQL.SetUserPermissions({UserID: msg.reply_to_message.from.id, permissions: "fahrer"}).then(function(result) {
							msg.reply.text(i18n.translate(lang[0].language, 'DriverManagment.Promote', { username: username }), {parseMode: 'html'});
						}).catch(error => console.log(error));
					}else{
						msg.reply.text(i18n.translate(lang[0].language, 'fehler.IsDerank'), {parseMode: 'html'}).catch(error => console.log(error));
					}
				}else{
					msg.reply.text(i18n.translate(lang[0].language, 'fehler.NotEnothPerms'), {parseMode: 'html'}).catch(error => console.log(error));
				}
			})
		}else{
			msg.reply.text(i18n.translate(lang[0].language, 'fehler.MustBeReply'), {parseMode: 'html'}).catch(error => console.log(error));
		}
	}).catch(error => console.log(error));
});

bot.on([/^\/remDriver/i, /^\/remFahrer/i], (msg) => {
	SQL.GetUserLang({UserID: msg.from.id}).then(function(lang) {
		bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => console.log(error));
		if ('reply_to_message' in msg) {
			var UserID = msg.reply_to_message.from.id
			if ('username' in msg.reply_to_message.from) {
				var username = f.cleanString(msg.reply_to_message.from.username.toString());
			}else{
				var username = f.cleanString(msg.reply_to_message.from.first_name.toString());
			}
			Promise.all([SQL.GetUserPermissions({UserID: msg.from.id}), SQL.GetUserPermissions({UserID: UserID})]).then(function(PAll) {
				if(admin.includes(PAll[0][0].permissions) && PAll[1][0].permissions === "fahrer"){
					if(PAll[1][0].permissions !== "admin"){
						SQL.SetUserPermissions({UserID:  msg.reply_to_message.from.id, permissions: "user"}).then(function(result) {
							msg.reply.text(i18n.translate(lang[0].language, 'DriverManagment.Demote', { username: username }), {parseMode: 'html'});
						}).catch(error => console.log(error));
					}else{
						msg.reply.text(i18n.translate(lang[0].language, 'fehler.IsDerank'), {parseMode: 'html'});
					}
				}else{
					msg.reply.text(i18n.translate(lang[0].language, 'fehler.NotEnothPerms'), {parseMode: 'html'});
				}
			})
		}else{
			msg.reply.text(i18n.translate(lang[0].language, 'fehler.MustBeReply'), {parseMode: 'html'});
		}
	}).catch(error => console.log(error));
});

//Admin Managment
bot.on([/^\/addAdmin/i], (msg) => {
	SQL.GetUserLang({UserID: msg.from.id}).then(function(lang) {
		bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => console.log(error));
		if ('reply_to_message' in msg) {
			var UserID = msg.reply_to_message.from.id
			if ('username' in msg.reply_to_message.from) {
				var username = f.cleanString(msg.reply_to_message.from.username.toString());
			}else{
				var username = f.cleanString(msg.reply_to_message.from.first_name.toString());
			}
			Promise.all([SQL.GetUserPermissions({UserID: msg.from.id}), SQL.GetUserPermissions({UserID: UserID})]).then(function(PAll) {

				if(PAll[1].length > 0){
					if(admin.includes(PAll[0][0].permissions) && PAll[1][0].permissions !== "admin"){
						SQL.SetUserPermissions({UserID: msg.reply_to_message.from.id, permissions: "admin"}).then(function(result) {
							msg.reply.text(i18n.translate(lang[0].language, 'AdminManagment.Promote', { username: username }), {parseMode: 'html'});
						}).catch(error => console.log(error));
					}else{
						msg.reply.text(i18n.translate(lang[0].language, 'fehler.NotEnothPerms'), {parseMode: 'html'}).catch(error => console.log(error));
					}
				}else{
					msg.reply.text(i18n.translate(lang[0].language, 'AdminManagment.NotReg'), {parseMode: 'html'}).catch(error => console.log(error));
				}
			})
		}else{
			msg.reply.text(i18n.translate(lang[0].language, 'fehler.MustBeReply'), {parseMode: 'html'}).catch(error => console.log(error));
		}
	}).catch(error => console.log(error));
});

bot.on([/^\/remAdmin/i], (msg) => {
	SQL.GetUserLang({UserID: msg.from.id}).then(function(lang) {
		bot.deleteMessage(msg.chat.id, msg.message_id).catch(error => console.log(error));
		if ('reply_to_message' in msg) {
			var UserID = msg.reply_to_message.from.id
			if ('username' in msg.reply_to_message.from) {
				var username = f.cleanString(msg.reply_to_message.from.username.toString());
			}else{
				var username = f.cleanString(msg.reply_to_message.from.first_name.toString());
			}
			Promise.all([SQL.GetUserPermissions({UserID: msg.from.id}), SQL.GetUserPermissions({UserID: UserID})]).then(function(PAll) {
				if(PAll[1].length > 0){
					if(admin.includes(PAll[0][0].permissions) && PAll[1][0].permissions === "admin"){
						SQL.SetUserPermissions({UserID:  msg.reply_to_message.from.id, permissions: "user"}).then(function(result) {
							msg.reply.text(i18n.translate(lang[0].language, 'AdminManagment.Demote', { username: username }), {parseMode: 'html'});
						}).catch(error => console.log(error));
					}else{
						msg.reply.text(i18n.translate(lang[0].language, 'fehler.NotEnothPerms'), {parseMode: 'html'});
					}
				}else{
					msg.reply.text(i18n.translate(lang[0].language, 'AdminManagment.NotReg'), {parseMode: 'html'});
				}
			})
		}else{
			msg.reply.text(i18n.translate(lang[0].language, 'fehler.MustBeReply'), {parseMode: 'html'});
		}
	}).catch(error => console.log(error));
});
//Oder Taxi with location event
bot.on('location', (location) => {
	Promise.all([SQL.GetUserPermissions({UserID: location.from.id}), SQL.GetUserLang({UserID: location.from.id})]).then(function(PAll) {
		if(user.includes(PAll[0][0].permissions)){
			const RString = randomstring.generate({
				length: 20,
				charset: 'hex'
			});

			let replyMarkup = bot.inlineKeyboard([
				[
					bot.inlineButton("✅", {callback: `${location.from.id}_loc_${RString}_t`}),
					bot.inlineButton("❌", {callback: `${location.from.id}_loc_${RString}_f`})
				]
			]);

			Geocode.reverseGeocode({
				point: { lat_lng: [location.location.latitude, location.location.longitude], radius: 50 },
				boundary_country: ["DE"]
			  })
				.then(function(response) {
					let AdressString = `${response.features[0].properties.name}, ${response.features[0].properties.locality}, ${response.features[0].properties.region}`
					SQL.CreateRequest({ID: RString, lat: location.location.latitude, lon: location.location.longitude, adress: AdressString, UserID: location.from.id}).then(function(res) {
						location.reply.text(i18n.translate(PAll[1][0].language, 'OnLocation.BestätigungAdress', {adress: AdressString, anbieter: response.features[0].properties.source}), {parseMode: 'html', replyMarkup});
					}).catch(function(error) {
						if(error.code === "ER_DUP_ENTRY"){
							location.reply.text(i18n.translate(data[2], 'OnLocation.InternerFehler'));
						}else{
							location.reply.text(i18n.translate(data[2], 'OnLocation.UnknownError'));
						}
					});
				})
				.catch(function(err) {
					SQL.CreateRequest({ID: RString, lat: location.location.latitude, lon: location.location.longitude, adress: "API Limit reached"}).then(function(res) {
						location.reply.text(i18n.translate(PAll[1][0].language, 'OnLocation.Bestätigung'), {parseMode: 'html', replyMarkup});
					}).catch(function(error) {
						if(error.code === "ER_DUP_ENTRY"){
							location.reply.text(i18n.translate(data[2], 'OnLocation.InternerFehler'));
						}else{
							location.reply.text(i18n.translate(data[2], 'OnLocation.UnknownError'));
						}
					});
				});

			  Geocode.clear();

		}else{
			location.reply.text(i18n.translate(PAll[1][0].language, 'OnLocation.NotRegistriert'), {parseMode: 'html'});
		}
	});
});

//Callback for Buttons

bot.on('callbackQuery', (msg) => {
	//f.log("User: " + msg.from.username + "(" + msg.from.id + ") sended request with data " + msg.data)
	//console.log(msg)
	if ('inline_message_id' in msg) {	
		var inlineId = msg.inline_message_id;
	}else{
		var chatId = msg.message.chat.id;
		var messageId = msg.message.message_id;
	}

	var data = msg.data.split("_")
	if(parseInt(data[0]) === msg.from.id && data[1] !== "req")	//Button is only usable by the creator
	{
		if(data[1] === "Clang"){
			if ('username' in msg.from) {
				var username = f.cleanString(msg.from.username.toString());
			}else{
				var username = f.cleanString(msg.from.first_name.toString());
			}
			SQL.CreateUser({UserID: msg.from.id, username: username, language: data[2]}).then(function(result) {
				var Message = i18n.translate(data[2], 'start.NachSprachEinabe')
				if ('inline_message_id' in msg) {
					bot.editMessageText(
						{inlineMsgId: inlineId}, Message,
						{parseMode: 'html'}
					).catch(error => console.log('Error:', error));
				}else{
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, Message,
						{parseMode: 'html'}
					).catch(error => console.log('Error:', error));
				}
			}).catch(function(error) {
				var Message = "";
					if(error.code === "ER_DUP_ENTRY"){
						bot.answerCallbackQuery(msg.id,{
							text: i18n.translate(data[2], 'start.AlreadyReg'),
						});
						Message = i18n.translate(data[2], 'start.AlreadyReg')
					}else{
						bot.answerCallbackQuery(msg.id,{
							text: i18n.translate(data[2], 'start.UnknownError'),
						});
						Message = i18n.translate(data[2], 'start.UnknownError')
					}
					if ('inline_message_id' in msg) {
						bot.editMessageText(
							{inlineMsgId: inlineId}, Message,
							{parseMode: 'html'}
						).catch(error => console.log('Error:', error));
					}else{
						bot.editMessageText(
							{chatId: chatId, messageId: messageId}, Message,
							{parseMode: 'html'}
						).catch(error => console.log('Error:', error));
					}
			});
		}else if(data[1] === "lang"){
			SQL.SetUserLang({UserID: msg.from.id, language: data[2]}).then(function(result) {
				var Message = i18n.translate(data[2], 'sprache.WurdeGeändert')
				if ('inline_message_id' in msg) {
					bot.editMessageText(
						{inlineMsgId: inlineId}, Message,
						{parseMode: 'html'}
					).catch(error => console.log('Error:', error));
				}else{
					bot.editMessageText(
						{chatId: chatId, messageId: messageId}, Message,
						{parseMode: 'html'}
					).catch(error => console.log('Error:', error));
				}
				bot.answerCallbackQuery(msg.id);
			}).catch(function(error) {
				console.log(error)
			});
		}else if(data[1] === "loc"){
			if(data[3] === "t"){
				SQL.AcceptRequest({ID: data[2]}).then(function(result) {
					let AdminChatReturn = GetAdminChat()
					SQL.GetRequest({ID: data[2].trim()}).then(function(request) {
						SQL.GetUser({UserID: request[0].UserID}).then(function(user) {
							let replyMarkup = bot.inlineKeyboard([
								[
									bot.inlineButton("✅", {callback: `${data[0]}_req_${data[2]}_t`}),
									bot.inlineButton("❌", {callback: `${data[0]}_req_${data[2]}_f`})
								]
							]);
							let GoogleMapsURL = `https://www.google.de/maps/@${request[0].lat},${request[0].lon},20z`
							bot.sendMessage(AdminChatReturn.ChatID,  i18n.translate(AdminChatReturn.language, 'Ordering.Anfrage', {username: user[0].username, adress: request[0].adress, GoogleMapsURL: GoogleMapsURL, userscore: user[0].UserScore}), {parseMode: 'html', webPreview: false, replyMarkup})
							var Message = i18n.translate(user[0].language, 'Ordering.EditUserAnfrage')
							bot.answerCallbackQuery(msg.id);
							if ('inline_message_id' in msg) {
								bot.editMessageText(
									{inlineMsgId: inlineId}, Message,
									{parseMode: 'html'}
								).catch(error => console.log('Error:', error));
							}else{
								bot.editMessageText(
									{chatId: chatId, messageId: messageId}, Message,
									{parseMode: 'html'}
								).catch(error => console.log('Error:', error));
							}
						}).catch(error => console.log('Error:', error));
					}).catch(error => console.log('Error:', error));
				}).catch(error => console.log('Error:', error));
			}else if(data[3] === "f"){
				SQL.GetRequest({ID: data[2]}).then(function(request) {
					SQL.GetUser({UserID: request[0].UserID}).then(function(user) {
						var Message = i18n.translate(user[0].language, 'Ordering.AnfrageAbbrechen')
						bot.answerCallbackQuery(msg.id);
						if ('inline_message_id' in msg) {
							bot.editMessageText(
								{inlineMsgId: inlineId}, Message,
								{parseMode: 'html'}
							).catch(error => console.log('Error:', error));
						}else{
							bot.editMessageText(
								{chatId: chatId, messageId: messageId}, Message,
								{parseMode: 'html'}
							).catch(error => console.log('Error:', error));
						}
					}).catch(error => console.log('Error:', error));
				}).catch(error => console.log('Error:', error));
			}
		}else if(data[1] === "rep"){
			SQL.GetRequest({ID: data[2]}).then(function(request) {
				SQL.GetUser({UserID: request[0].UserID}).then(function(Kunde) {
					SQL.GetUser({UserID: data[0]}).then(function(Fahrer) {
						if(data[3] === "plus"){
							var Amount = 1;
							var Message = i18n.translate(Fahrer[0].language, 'rating.Plus', {kundenname: Kunde[0].username, fahrername: Fahrer[0].username, adresse: request[0].adress});
						}else{
							var Amount = -1;
							var Message = i18n.translate(Fahrer[0].language, 'rating.Minus', {kundenname: Kunde[0].username, fahrername: Fahrer[0].username, adresse: request[0].adress});
						}
						SQL.SetUserRep({UserID: request[0].UserID, Amount: Amount}).then(function(Rep) {
							console.log(Rep)
							bot.answerCallbackQuery(msg.id,{
								showAlert: true,
								text: Rep,
							});
							if ('inline_message_id' in msg) {
								bot.editMessageText(
									{inlineMsgId: inlineId}, Message,
									{parseMode: 'html'}
								).catch(error => console.log('Error:', error));
							}else{
								bot.editMessageText(
									{chatId: chatId, messageId: messageId}, Message,
									{parseMode: 'html'}
								).catch(error => console.log('Error:', error));
							}
						}).catch(error => console.log('Error:', error));
					}).catch(error => console.log('Error:', error));
				}).catch(error => console.log('Error:', error));
			}).catch(error => console.log('Error:', error));
		}
	}else{ 	//Usable by everyone
		if(data[1] === "req"){
			if(data[3] === "t"){
				SQL.GetUser({UserID: msg.from.id}).then(function(FromUser) {
					SQL.GetRequest({ID: data[2]}).then(function(request) {
						if(fahrer.includes(FromUser[0].permissions)){
							SQL.GetUserLang({UserID: data[0]}).then(function(Kunde) {
								SQL.ConfirmedRequest({ID: data[2]}).then(function(result) {
									let GoogleMapsURL = `https://www.google.de/maps/@${request[0].lat},${request[0].lon},20z`
									bot.sendMessage(data[0], i18n.translate(Kunde[0].language, 'Ordering.AuftragAngenommenUser', {adress: request[0].adress, GoogleMapsURL: GoogleMapsURL}), {parseMode: 'html', webPreview: false})
									var Message = i18n.translate(FromUser[0].language, 'Ordering.EditAuftragAngenommenUser', {username: FromUser[0].username})

									let replyMarkup = bot.inlineKeyboard([
										[
											bot.inlineButton("+1", {callback: `${msg.from.id}_rep_${data[2]}_plus`}),
											bot.inlineButton("-1", {callback: `${msg.from.id}_rep_${data[2]}_minus`})
										]
									]);

									bot.answerCallbackQuery(msg.id);
									if ('inline_message_id' in msg) {
										bot.editMessageText(
											{inlineMsgId: inlineId}, Message,
											{parseMode: 'html', replyMarkup}
										).catch(error => console.log('Error:', error));
									}else{
										bot.editMessageText(
											{chatId: chatId, messageId: messageId}, Message,
											{parseMode: 'html', replyMarkup}
										).catch(error => console.log('Error:', error));
									}
								}).catch(error => console.log('Error:', error));
							}).catch(error => console.log('Error:', error));
						}else{
							bot.answerCallbackQuery(msg.id,{
								showAlert: true,
								text: "This button is not for you.",
							});
						}
					}).catch(error => console.log('Error:', error));
				}).catch(error => console.log('Error:', error));
			}else if(data[3] === "f"){
				SQL.GetUser({UserID: msg.from.id}).then(function(FromUser) {
					if(fahrer.includes(FromUser[0].permissions)){
						SQL.GetUserLang({UserID: data[0]}).then(function(Kunde) {
							bot.sendMessage(data[0], i18n.translate(Kunde[0].language, 'Ordering.AuftragAbgelehntUser'), {parseMode: 'html', webPreview: false})
							var Message = i18n.translate(FromUser[0].language, 'Ordering.EditAuftragAbgelehntUser', {username: FromUser[0].username})
							bot.answerCallbackQuery(msg.id);
							if ('inline_message_id' in msg) {
								bot.editMessageText(
									{inlineMsgId: inlineId}, Message,
									{parseMode: 'html'}
								).catch(error => console.log('Error:', error));
							}else{
								bot.editMessageText(
									{chatId: chatId, messageId: messageId}, Message,
									{parseMode: 'html'}
								).catch(error => console.log('Error:', error));
							}
						}).catch(error => console.log('Error:', error));
					}else{
						bot.answerCallbackQuery(msg.id,{
							showAlert: true,
							text: "This button is not for you.",
						});
					}
				}).catch(error => console.log('Error:', error));
			}
		}
	}
});

bot.start();


require('dotenv').config();
const mysql = require('mysql');
PermissionGroups = process.env.Rechte.split(".")

var db = mysql.createPool({
	connectionLimit : 100,
	host: process.env.DB_Host,
	user: process.env.DB_User,
	password: process.env.DB_Passwort,
	database: process.env.DB_Name,
	charset : 'utf8mb4_bin'
});

/* Users */

let CreateUser = function({ UserID, username, language}) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
            var sqlcmd = "INSERT INTO users (userID, username, language, permissions, UserScore, FahrerScore, FahrerFahrten) VALUES ?";
			var values = [[UserID, username, language, "user", "0", "0", "0"]];
			connection.query(sqlcmd, [values], function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		});
	});
}

let GetUserLang = function({ UserID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `SELECT language FROM users where userID = ${UserID};`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	})
}

let GetUserPermissions = function({ UserID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `SELECT permissions FROM users where userID = ${UserID};`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	})
}

let SetUserLang = function({ UserID, language }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `UPDATE users SET language = '${language}' WHERE userID = '${UserID}';`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	})
}

let SetUserPermissions = function({ UserID, permissions }) {
	if(PermissionGroups.includes(permissions)){
		return new Promise(function(resolve, reject) {
			db.getConnection(function(err, connection){
				if(err) reject(err);
				var sqlcmd = `UPDATE users SET permissions = '${permissions}' WHERE userID = '${UserID}';`
				connection.query(sqlcmd, function(err, rows, fields) {
					if(err) reject(err);
					connection.release();
					resolve(rows);
				});
			})
		})
	}else{
		resolve(`${permissions} does not exist. Avaible are ${PermissionGroups}`);
	}
}

let GetUser = function({ UserID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `SELECT * FROM users where UserID = '${UserID}';`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	})
}

let SetUserRep = function({ UserID, Amount }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `SELECT UserScore FROM users where userID = ${UserID};`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				let newScore = Number(rows[0].UserScore) + Number(Amount)
				var setsqlcmd = `UPDATE users SET UserScore = '${newScore}' WHERE userID = '${UserID}';`
				connection.query(setsqlcmd, function(err, rows, fields) {
					if(err) reject(err);
					connection.release();
					resolve(newScore);
				});
			});
		})
	})
}

/* Requests */

let CreateRequest = function({ ID, lat, lon, adress, UserID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = "INSERT INTO requests (ID, lat, lon, adress, passagiere, requested, confirmed, UserID, FahrerID) VALUES ?";
			var values = [[ID, lat, lon, adress, "0", "0", "0", UserID, "0",]];
			connection.query(sqlcmd, [values], function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	})
}

let SetPassagiere = function({ ID, passagiere }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `UPDATE requests SET passagiere = '${passagiere}' WHERE ID = '${ID}';`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	});
}

let AcceptRequest = function({ ID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `UPDATE requests SET requested = '1' WHERE ID = '${ID}';`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	});
}

let ConfirmedRequest = function({ ID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `UPDATE requests SET confirmed = '1' WHERE ID = '${ID}';`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	});
}

let GetRequest = function({ ID }) {
	return new Promise(function(resolve, reject) {
		db.getConnection(function(err, connection){
			if(err) reject(err);
			var sqlcmd = `SELECT * FROM requests where ID = '${ID}';`
			connection.query(sqlcmd, function(err, rows, fields) {
				if(err) reject(err);
				connection.release();
				resolve(rows);
			});
		})
	})
}

module.exports = {
	CreateUser,
	GetUserLang,
	GetUserPermissions,
	SetUserLang,
	SetUserPermissions,
	GetUser,
	SetUserRep,
	CreateRequest,
	SetPassagiere,
	AcceptRequest,
	ConfirmedRequest,
	GetRequest
};
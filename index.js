const express = require('express'),
	dotenv = require('dotenv').config(),
	mongo = require('mongodb').MongoClient,
	readline = require('readline'),
	fs = require('fs');

const dbuser = process.env.MONGOLAB_USER,
	dbpassword = process.env.MONGOLAB_PASSWORD;

const app = express(),
	port = process.env.PORT || 80,
	mongoUrl = `mongodb://${dbuser}:${dbpassword}@ds149479.mlab.com:49479/history_quiz_database`,
	rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

rl.question('Ile pytań wylosować z bazy?\n', (answer) => {
	console.log(`Z bazy zostanie wylosowane ${answer} pytań`);
	rl.close();
	mongo.connect(mongoUrl, (err, db) => {
		if (err) throw err;

		let collectionName = 'PRL - osoby',
			collection = db.collection(collectionName);

		collection.find({}).toArray( (err, result) => {
			if (err) throw err;
			if (answer <= result.length) {
				let arr = [];
				for(let i=0; i<answer; i++) {
					let min = 0,
						max = result.length - 1;

					let randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
					arr.push(result[randomNumber].json);
					//usuwa wybrany element z tablicy glownej by nie powtarzaly sie elementy
					//to jest SPLICE!!!
					result.splice(result.indexOf(result[randomNumber]), 1); 
				}
				saveToFile(arr, collectionName);
			}
			else {
				console.log('Liczba musi byc wieksza niz dlugosc rekordow w bazie!');
			}
		});
		db.close();
	});
});

function saveToFile(arr, fileName) {
	fileName += '.txt';

	let stringifiedArray = "",
		answers = ['odpowiedz_A', 'odpowiedz_B', 'odpowiedz_C', 'odpowiedz_D'];
	arr.forEach((item) => {
		let foo = `${item['pytanie']}{||}`;
		for(let i=0; i<4; i++)
			foo += `{i}${item[answers[i]]}{I}{||}`;
		foo += `${item['poprawna_odpowiedz']}{V}\n`;
		stringifiedArray += foo;
	});
	fs.readFile(`${__dirname}/Result/${fileName}`, (err, data) => {
		if (err) {
			fs.writeFile(`${__dirname}/Result/${fileName}`, stringifiedArray, (err) => {
				if (err) throw err;
				console.log('Plik jest gotowy!');
			});
		}
		else {
			fs.rmdir(`${__dirname}/Result/${fileName}`, () => {
				fs.writeFile(`${__dirname}/Result/${fileName}`, stringifiedArray, (err) => {
					if (err) throw err;
					console.log('Plik jest gotowy!');
				});
			})
		}
	});
}
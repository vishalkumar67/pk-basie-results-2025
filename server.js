// server.js
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const fs = require('fs');

const DB_FILE = path.join(__dirname, 'data.db');

// create DB if not exists and load sample data if empty
function initDb(cb){
  const exists = fs.existsSync(DB_FILE);
  const db = new sqlite3.Database(DB_FILE);
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      roll TEXT,
      name TEXT,
      class TEXT,
      marks INTEGER,
      grade TEXT,
      details TEXT
    )`, (err) => {
      if(err) console.error(err);
      if(!exists){
        const stmt = db.prepare("INSERT INTO results (roll,name,class,marks,grade,details) VALUES (?,?,?,?,?,?)");
        stmt.run("1234444","Ali Khan","SSC-II",789,"A+","Sample details for Ali");
        stmt.run("2223334","Fatima Noor","HSSC-I",812,"A+","Sample details for Fatima");
        stmt.run("5556667","Zain Rajpoot","DIPLOMA",720,"A","Sample Diploma result");
        stmt.finalize(cb);
      } else cb();
    });
  });
  db.close();
}

initDb(()=> console.log("DB initialized (if it was missing)."));

const app = express();
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// index
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public','index.html'));
});

// simple API for search (GET)
app.get('/result', (req, res) => {
  // expects ?class=...&rollNo=...&name=...
  const cls = req.query.class || '';
  const roll = (req.query.rollNo || '').trim();
  const name = (req.query.name || '').trim();

  const db = new sqlite3.Database(DB_FILE);
  let sql = "SELECT * FROM results WHERE 1=1";
  const params = [];

  if(roll){
    sql += " AND roll = ?";
    params.push(roll);
  }
  if(name){
    sql += " AND lower(name) LIKE ?";
    params.push('%' + name.toLowerCase() + '%');
  }
  if(cls){
    sql += " AND class = ?";
    params.push(cls);
  }

  db.get(sql, params, (err, row) => {
    if(err){
      console.error(err);
      res.status(500).send("Server error");
      db.close();
      return;
    }
    if(!row){
      // no result — show not found page
      res.sendFile(path.join(__dirname,'public','notfound.html'));
      db.close();
      return;
    }
    // render a simple result page
    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Result for ${row.name}</title>
          <link rel="stylesheet" href="/public/style.css">
        </head>
        <body>
          <div class="container">
            <div class="login-card">
              <h4>Result: ${row.class}</h4>
              <div class="login-main">
                <div class="card">
                  <p><strong>Name:</strong> ${row.name}</p>
                  <p><strong>Roll:</strong> ${row.roll}</p>
                  <p><strong>Marks:</strong> ${row.marks}</p>
                  <p><strong>Grade:</strong> ${row.grade}</p>
                  <p><strong>Details:</strong> ${row.details}</p>
                </div>
                <a href="/" class="btn-primary" style="display:inline-block;margin-top:16px;text-decoration:none;padding:12px 18px;border-radius:10px;">Back</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    res.send(html);
    db.close();
  });
});

// start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server started on port", PORT));

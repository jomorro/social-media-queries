const { Client } = require('pg');
const express = require('express');

// create an express application
const app = express();
app.use(express.json());
// create a postgresql client
const client = new Client({
    database: 'social-media'
});

// route handlers go here
app.get('/users', (req, res) => {
    client.query('SELECT * FROM users', (err, result) => {
        if (err) {
            res.status(500).send();
            return console.log(err);
        }
        res.send(result.rows);
    });
});

app.post('/users', (req, res) => {
    const text = 'INSERT INTO users (username, bio) VALUES ($1, $2) RETURNING *';
    const values = [req.body.username, req.body.bio];
    client.query(text, values, (err, result) => {
        if (err) {
            res.status(500).send();
            return console.log(err);
        }
        res.status(200).send(JSON.stringify(result.rows[0]));
    });
});

app.post('/users/:id', (req, res) => {
    const text = 'INSERT INTO posts (title, body, user_id) VALUES ($1, $2, $3) RETURNING *';
    const values = [req.body.title, req.body.body, req.params.id];
    client.query(text, values, (err, result) => {
        if (err) {
            res.status(404).send({});
            return console.log(err);
        }
        res.status(200).send(JSON.stringify(result.rows[0]));
    });
});

app.get('/users/:id', (req, res) => {
    const id = req.params.id;
    client.query('SELECT posts.id as id, users.id as user_id, title, body, username, bio FROM users LEFT JOIN posts ON (users.id = posts.user_id) WHERE (users.id=($1))', [id], (err, result) => {
       if (err) {
            res.status(500).send({});
            return console.log(err);
        }
        if (result.rowCount == 0) {
            return res.status(404).send({});
        }

        const posts = result.rows.reduce(function(accumulator, post) {
            if (!accumulator.id) {
                accumulator.username = post.username,
                accumulator.bio = post.bio,
                accumulator.id = post.user_id,
                accumulator.posts = []
            }
            if (post.id != null) {
                accumulator.posts.push({id: post.id, title: post.title, body: post.body});
            }
            return accumulator;
        }, {});
        res.status(200).send(JSON.stringify(posts));
    });
});

// start a server that listens on port 3000 and connects the sql client on success
app.listen(3000, () => {
    client.connect();
});
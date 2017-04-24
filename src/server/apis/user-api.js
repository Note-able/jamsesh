import { UserService } from '../services';

const Formidable = require('formidable');
const config = require('../../config');
const image = require('../../util/gcloud-util')(config.gcloud, config.cloudImageStorageBucket);
const bcrypt = require('bcrypt-nodejs');

module.exports = function userApi(app, options) {
  const userService = new UserService(options);

  /** *PICTURES API* **/


  // Currently only works with one picture. No mass upload.
  const uploadPicture = (req, res, next) => {
    const form = new Formidable.IncomingForm();
    form.maxFieldsSize = 50 * 1024 * 1024;

    form.onPart = (part) => {
      form.handlePart(part);
    };

    form.parse(req, (err, fields) => {
      const buffer = new Buffer(fields[Object.keys(fields)[0]], 'base64');
      const splits = Object.keys(fields)[0].split('.');

      image.sendUploadToGCS(splits[splits.length - 1], buffer)
      .then(response => {
        console.log(response);
        next(response);
      })
      .catch(error => {
        console.log(error);
      });
    });
  };

  app.get('/user/me', options.auth, (req, res) => {
    res.redirect(`/user/${req.user.id}`);
  });

  app.get('/user/search/{text}', options.auth, (req, res) => {
    if (req.params.text.length === 0) {
      res.status(400).send();
    } else {
      // elasticsearch for users
    }
  });

  /** USER API **/

  app.post('/user/edit', options.auth, options.auth, (req, res) => {
    console.log(req.body) // <- standard for getting things out post.

    options.connect(options.database, (connection) => {
      console.log(connection);
    });
    res.send('lol');
  });

  app.post('/register', (req, res) => {
    console.log(req.body);
    if (req.body.email == null || req.body.password == null) {
      res.status(400).json({ badRequest: 'empty username or password' });
      return;
    }

    if (req.body.firstName == null || req.body.lastName == null) {
      res.status(400).json({ badRequest: 'empty firstname or lastname' });
      return;
    }

    bcrypt.hash(req.body.password, null, null, (err, password) => {
      if (err) {
        res.status(500).send();
        return;
      }

      userService.registerUser(req.body.email, password, req.body.firstName, req.body.lastName)
        .then(user => res.json(user))
        .catch(error => res.status(500).json(error));
    });
  });

  app.post('/user/profile/:userId', options.auth, (req, res) => {
    if (req.user.id !== req.params.userId) {
      res.status(400).send();
      return;
    }

    userService.updateProfile(req.body, () => {
      res.status(201).send();
    });
  });

  app.get('/user/:id', options.auth, (req, res) => {
    if (!req.user) {
      res.status(400).send();
      return;
    }

    userService.getUser(req.params.id, (user) => {
      if (user == null) {
        res.status(404).send();
        return;
      }

      res.send(user);
    });
  });

  app.post('/user/edit/picture/new', options.auth, (req, res) => {
    if (!req.user) {
      res.status(400).send();
    }

    uploadPicture(req, res, (gcloudResponse) => {
      if (gcloudResponse == null) {
        res.status(500).send();
        return;
      }

      options.connect(options.database, (connection) => {
        const user = [];
        connection.client.query(`INSERT INTO pictures (user_id, filename, picture_type) VALUES (${req.user.id}, '${gcloudResponse.cloudStorageObject}', 1);`)
        .on('row', (row) => { user.push(row); })
        .on('error', (error) => { console.log(`error encountered ${error}`); })
        .on('end', () => {
          connection.done();
          res.status(200).send(gcloudResponse);
        });
      });
    });
  });

  app.post('/user/follow/:userId', options.auth, (req, res) => {
    if (!req.user) {
      res.status(400).send();
    }

    if (req.user.id === parseInt(req.params.userId, 10)) {
      res.status(204).send();
    }

    options.connect(options.database, (connection) => {
      connection.client.query(`
        INSERT INTO followers (origin, destination)
        SELECT 1, 2
        WHERE
          NOT EXISTS (
            SELECT * FROM followers WHERE origin = ${req.user.id} AND destination = ${req.params.userId}
          );
      `).on('error', error => { console.log(`error following user: ${error}`); })
      .on('end', () => {
        connection.done();
        res.status(200).send();
      });
    });
  });
};
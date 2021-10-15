require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { celebrate, Joi } = require('celebrate');
const { errors } = require('celebrate');
const crypto = require('crypto');
const { login, createUser } = require('./controllers/users');
const auth = require('./middlewares/auth');
const { errorLogger, requestLogger } = require('./middlewares/logger');
const { BASE_URL = 'mongodb://localhost:27017/bitfilmsdb' } = process.env;
const { PORT = 3000 } = process.env;
const app = express();

const allowedCors = [
  'https://mixakras.films.nomoredomains.club',
  'https://api.mixakras.films.nomoredomains.club',
  'http://localhost:3000',
];

app.use(cors({
  origin(origin, callback) {
    if (allowedCors.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Проблемы с CORS'));
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  credentials: true,
}));
app.options('*', cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // за 15 минут
  max: 100,
});

/* app.use(cors({
  origin: allowedCors,
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  next();
}); */

console.log(process.env.NODE_ENV);

const randomString = crypto
  .randomBytes(16)
  .toString('hex');

console.log(randomString);

mongoose.connect(BASE_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  useUnifiedTopology: true,
});

app.use(requestLogger);
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());

app.post('/signup', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    name: Joi.string().required().min(2).max(30),
  }),
}), createUser);
app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);

app.use(auth);

app.use('/', require('./routes/users'));
app.use('/', require('./routes/movies'));
app.use('*', require('./routes/NotFound'));

app.use(errorLogger);

app.use(errors());
app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).send({ message: statusCode === 500 ? 'Ошибка по умолчанию' : message });
  next();
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

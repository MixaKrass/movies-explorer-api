const Movie = require('../models/movie');
const BadReqError = require('../errors/bad-req-err');
const NotFoundError = require('../errors/not-found-err');
const ForbiddenError = require('../errors/forbiden-err');

const getMovies = (req, res, next) => {
  Movie.find({})
    .then((movies) => {
      res.status(200).send(movies);
    })
    .catch(next);
};

const createMovie = (req, res, next) => {
  const {
    country,
    director,
    duration,
    year,
    description,
    image,
    trailer,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
  } = req.body;
  const owner = req.user._id;
  Movie.create({
    country,
    director,
    duration,
    year,
    description,
    image,
    trailer,
    nameRU,
    nameEN,
    thumbnail,
    movieId,
    owner,
  })
    .then((movie) => {
      res.status(200).send(movie);
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadReqError('Проверьте обязательные поля');
      }
    })
    .catch(next);
};

const deleteMovie = (req, res, next) => {
  Movie.findById(req.params.movieId)
    .orFail(() => {
      throw new Error('IncorrectId');
    })
    .then((movie) => {
      if (movie.owner._id.toString() === req.user._id) {
        Movie.deleteOne(movie).then(() => {
          res.status(200).send({ message: 'фильм удален' });
        });
      } else {
        throw new ForbiddenError('У тебя нет прав на удаление этого фильма');
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadReqError('Карточка по указанному id не найдена');
      } else if (err.message === 'IncorrectId') {
        throw new NotFoundError('Карточка по указанному id не найдена');
      } else next(err);
    });
};

module.exports = {
  getMovies, createMovie, deleteMovie,
};

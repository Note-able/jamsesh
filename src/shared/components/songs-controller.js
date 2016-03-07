'use strict';

const AJAX = require('../ajax');
const React = require('react');
const ReactDOM = require('react-dom');
const Router = require('react-router');

module.exports = class SongsController extends React.Component {
  constructor (props, context) {
    super(props, context);

    const songData = [{ title: 'song1', dateCreated: 'Just Now' }, { title: 'song2', dateCreated: 'January 1st, 2016' }];
    this.state = { songData: songData };
  }

  componentDidMount () {
    AJAX.Get('songs/user', (response) => this.loadSongs(JSON.parse(response)));
  }

  loadSongs (songJson) {
    console.log(songJson);
    const newSongData = songJson.map((song) => {
      return { title: song.title, dateCreated: song.date };
    });
    this.setState({ songData: newSongData });
  }

  render () {
    return (
      <div>
        <div className="button-container">
          <form action="/editor">
            <input className="create-song" type="submit" value="Create"></input>
          </form>
        </div>
        <div className="song-list">
          { this.state.songData.map((song) => {
            return (
              <div className="song-list-item">
                <div className="song-list-item-title">{ song.title }</div>
                <div className="song-list-item-date">{ song.dateCreated }</div>
              </div>
            );
          })
          }
        </div>
      </div>
    );
  }
}
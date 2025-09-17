import Song from "../models/Song";

export default class SongController {
  static getSongs() {
    return [
      new Song(1, "Intro", "Berry", "/music/1.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(2, "Canción 1", "Berry", "/music/2.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(3, "Canción 2", "Berry", "/music/3.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(4, "Canción 3", "Berry", "/music/4.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(5, "Comercial #1", "Berry", "/music/5.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(6, "Canción 5", "Berry", "/music/6.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(7, "Canción 6", "Berry", "/music/7.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(8, "Canción 7", "Berry", "/music/8.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(9, "Canción 8", "Berry", "/music/9.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(10, "Canción 9", "Berry", "/music/10.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(11, "Canción 10", "Berry", "/music/11.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(12, "Comercial #2", "Berry", "/music/12.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(13, "Canción 11", "Berry", "/music/13.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(14, "Canción 12", "Berry", "/music/14.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(15, "Canción 13", "Berry", "/music/15.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(16, "Canción 14", "Berry", "/music/16.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(17, "Canción 15", "Berry", "/music/17.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
      new Song(18, "Outro", "Berry", "/music/18.wav", "/cover/ktv23-cover.png", "/cover/video.mp4"),
    ];
  }
}
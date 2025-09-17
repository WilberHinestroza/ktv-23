import Song from "../models/Song";

export default class SongController {
  static getSongs() {
    return [
      new Song(1, "Intro", "Berry", `${PUBLIC}/music/1.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(2, "Canción 1", "Berry", `${PUBLIC}/music/2.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(3, "Canción 2", "Berry", `${PUBLIC}/music/3.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(4, "Canción 3", "Berry", `${PUBLIC}/music/4.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(5, "Comercial #1", "Berry", `${PUBLIC}/music/5.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `/cover/video.mp4`),
      new Song(6, "Canción 5", "Berry", `${PUBLIC}/music/6.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(7, "Canción 6", "Berry", `${PUBLIC}/music/7.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(8, "Canción 7", "Berry", `${PUBLIC}/music/8.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(9, "Canción 8", "Berry", `${PUBLIC}/music/9.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(10, "Canción 9", "Berry", `${PUBLIC}/music/10.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(11, "Canción 10", "Berry", `${PUBLIC}/music/11.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(12, "Comercial #2", "Berry", `${PUBLIC}/music/12.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(13, "Canción 11", "Berry", `${PUBLIC}/music/13.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(14, "Canción 12", "Berry", `${PUBLIC}/music/14.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(15, "Canción 13", "Berry", `${PUBLIC}/music/15.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(16, "Canción 14", "Berry", `${PUBLIC}/music/16.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(17, "Canción 15", "Berry", `${PUBLIC}/music/17.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
      new Song(18, "Outro", "Berry", `${PUBLIC}/music/18.wav`, `${PUBLIC}/cover/ktv23-cover.png`, `${PUBLIC}/cover/video.mp4`),
    ];
  }
}
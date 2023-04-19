CREATE TABLE `config` (
	`id` integer PRIMARY KEY NOT NULL,
	`last_fm_key` text,
	`last_fm_secret` text,
	`last_fm_username` text,
	`last_fm_password` text,
	`soulseek_username` text,
	`soulseek_password` text,
	`spotify_client_id` text,
	`spotify_client_secret` text,
	`spotify_username` text,
	`spotify_password` text,
	`spotify_dc_cookie` text,
	`soundcloud_auth_token` text
);
--> statement-breakpoint
CREATE TABLE `soulseek_release_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `soulseek_track_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`file` text NOT NULL,
	`path` text,
	`status` text NOT NULL,
	`progress` integer,
	`error` blob,
	`release_download_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release_download_id`) REFERENCES `soulseek_release_downloads`(`id`)
);
--> statement-breakpoint
CREATE TABLE `soundcloud_playlist_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`playlist` blob,
	`error` blob,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `soundcloud_track_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`track_id` integer NOT NULL,
	`track` blob,
	`path` text,
	`status` text NOT NULL,
	`progress` integer,
	`error` blob,
	`playlist_download_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`playlist_download_id`) REFERENCES `soundcloud_playlist_downloads`(`id`)
);
--> statement-breakpoint
CREATE TABLE `spotify_album_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`album_id` text NOT NULL,
	`album` blob,
	`error` blob,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spotify_track_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`track` blob,
	`path` text,
	`status` text NOT NULL,
	`progress` integer,
	`error` blob,
	`album_download_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`album_download_id`) REFERENCES `spotify_album_downloads`(`id`)
);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` integer PRIMARY KEY NOT NULL,
	`hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `artists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `playlist_tracks` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`)
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`image_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`)
);
--> statement-breakpoint
CREATE TABLE `release_artists` (
	`release_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`release_id`, `artist_id`),
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`),
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`)
);
--> statement-breakpoint
CREATE TABLE `releases` (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text
);
--> statement-breakpoint
CREATE TABLE `track_artists` (
	`track_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`track_id`, `artist_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`),
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`)
);
--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` integer PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`title` text,
	`release_id` integer,
	`track_number` integer,
	`duration` integer NOT NULL,
	`favorite` integer NOT NULL,
	`image_id` integer,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`),
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usernameDirUniqueIndex` ON `soulseek_release_downloads` (`username`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `usernameFileUniqueIndex` ON `soulseek_track_downloads` (`username`,`file`);--> statement-breakpoint
CREATE UNIQUE INDEX `usernameFileReleaseDownloadIdUniqueIndex` ON `soulseek_track_downloads` (`username`,`file`,`release_download_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `playlistIdUniqueIndex` ON `soundcloud_playlist_downloads` (`playlist_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `trackIdPlaylistIdUniqueIndex` ON `soundcloud_track_downloads` (`track_id`,`playlist_download_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `albumIdUniqueIndex` ON `spotify_album_downloads` (`album_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `trackIdAlbumIdUniqueIndex` ON `spotify_track_downloads` (`track_id`,`album_download_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pathUniqueIndex` ON `tracks` (`path`);
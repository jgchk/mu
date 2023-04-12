CREATE TABLE `artists` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
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
	`has_cover_art` integer NOT NULL,
	`duration` integer NOT NULL,
	`favorite` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`)
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
	`progress` integer,
	`release_download_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`release_download_id`) REFERENCES `soulseek_release_downloads`(`id`)
);
--> statement-breakpoint
CREATE TABLE `soundcloud_playlist_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`playlist` blob,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `soundcloud_track_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`track_id` integer NOT NULL,
	`track` blob,
	`path` text,
	`progress` integer,
	`playlist_download_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`playlist_download_id`) REFERENCES `soundcloud_playlist_downloads`(`id`)
);
--> statement-breakpoint
CREATE TABLE `spotify_album_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`album_id` text NOT NULL,
	`album` blob,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `spotify_track_downloads` (
	`id` integer PRIMARY KEY NOT NULL,
	`track_id` text NOT NULL,
	`track` blob,
	`path` text,
	`progress` integer,
	`album_download_id` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`album_download_id`) REFERENCES `spotify_album_downloads`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pathUniqueIndex` ON `tracks` (`path`);--> statement-breakpoint
CREATE UNIQUE INDEX `usernameDirUniqueIndex` ON `soulseek_release_downloads` (`username`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `usernameFileUniqueIndex` ON `soulseek_track_downloads` (`username`,`file`);--> statement-breakpoint
CREATE UNIQUE INDEX `usernameFileReleaseDownloadIdUniqueIndex` ON `soulseek_track_downloads` (`username`,`file`,`release_download_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `playlistIdUniqueIndex` ON `soundcloud_playlist_downloads` (`playlist_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `trackIdPlaylistIdUniqueIndex` ON `soundcloud_track_downloads` (`track_id`,`playlist_download_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `albumIdUniqueIndex` ON `spotify_album_downloads` (`album_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `trackIdAlbumIdUniqueIndex` ON `spotify_track_downloads` (`track_id`,`album_download_id`);
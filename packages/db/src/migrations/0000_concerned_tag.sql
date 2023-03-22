CREATE TABLE artists (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);

CREATE TABLE release_artists (
	`release_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`release_id`, `artist_id`),
	FOREIGN KEY (`release_id`) REFERENCES releases(`id`),
	FOREIGN KEY (`artist_id`) REFERENCES artists(`id`)
);

CREATE TABLE release_downloads (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text
);

CREATE TABLE releases (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text
);

CREATE TABLE track_artists (
	`track_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`track_id`, `artist_id`),
	FOREIGN KEY (`track_id`) REFERENCES tracks(`id`),
	FOREIGN KEY (`artist_id`) REFERENCES artists(`id`)
);

CREATE TABLE track_downloads (
	`id` integer PRIMARY KEY NOT NULL,
	`service` text NOT NULL,
	`service_id` blob NOT NULL,
	`complete` integer NOT NULL,
	`name` text,
	`path` text,
	`release_download_id` integer,
	FOREIGN KEY (`release_download_id`) REFERENCES release_downloads(`id`)
);

CREATE TABLE tracks (
	`id` integer PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`title` text,
	`release_id` integer,
	`track_number` text,
	`has_cover_art` integer NOT NULL,
	FOREIGN KEY (`release_id`) REFERENCES releases(`id`)
);

CREATE TABLE soundcloud_playlist_downloads (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`playlist` blob
);

CREATE TABLE soundcloud_track_downloads (
	`id` integer PRIMARY KEY NOT NULL,
	`track_id` integer NOT NULL,
	`track` blob,
	`path` text,
	`progress` integer,
	`playlist_download_id` integer,
	FOREIGN KEY (`playlist_download_id`) REFERENCES soundcloud_playlist_downloads(`id`)
);

CREATE UNIQUE INDEX pathUniqueIndex ON tracks (`path`);
CREATE UNIQUE INDEX playlistIdUniqueIndex ON soundcloud_playlist_downloads (`playlist_id`);
CREATE UNIQUE INDEX trackIdPlaylistIdUniqueIndex ON soundcloud_track_downloads (`track_id`,`playlist_download_id`);
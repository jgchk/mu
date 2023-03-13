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
	`name` text NOT NULL
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
	`ref` integer NOT NULL,
	`complete` integer NOT NULL,
	`name` text NOT NULL,
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

CREATE UNIQUE INDEX pathUniqueIndex ON tracks (`path`);
CREATE TABLE albums (
	`id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL
);

CREATE TABLE artists (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);

CREATE TABLE tracks (
	`id` integer PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`title` text
);

CREATE TABLE track_artists (
	`track_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	PRIMARY KEY(`track_id`, `artist_id`),
	FOREIGN KEY (`track_id`) REFERENCES tracks(`id`),
	FOREIGN KEY (`artist_id`) REFERENCES artists(`id`)
);

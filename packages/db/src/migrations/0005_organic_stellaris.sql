CREATE TABLE `track_artists_new` (
	`track_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`track_id`, `artist_id`),
	FOREIGN KEY (`track_id`) REFERENCES `tracks`(`id`) ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `track_artists_new` SELECT * FROM `track_artists`;
--> statement-breakpoint
DROP TABLE `track_artists`;
--> statement-breakpoint
ALTER TABLE `track_artists_new` RENAME TO `track_artists`;

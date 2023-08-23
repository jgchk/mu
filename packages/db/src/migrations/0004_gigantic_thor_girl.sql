CREATE TABLE `release_artists_new` (
	`release_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL,
	PRIMARY KEY(`release_id`, `artist_id`),
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON DELETE cascade,
	FOREIGN KEY (`artist_id`) REFERENCES `artists`(`id`) ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `release_artists_new` SELECT * FROM `release_artists`;
--> statement-breakpoint
DROP TABLE `release_artists`;
--> statement-breakpoint
ALTER TABLE `release_artists_new` RENAME TO `release_artists`;

CREATE TABLE `track_artists_temp` (
	`track_id` integer NOT NULL,
	`artist_id` integer NOT NULL,
	`order` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `track_artists_temp` SELECT * FROM `track_artists`;
--> statement-breakpoint
CREATE TABLE `track_tags_temp` (
	`track_id` integer NOT NULL,
	`tag_id` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `track_tags_temp` SELECT * FROM `track_tags`;
--> statement-breakpoint
CREATE TABLE `playlist_tracks_temp` (
	`id` integer PRIMARY KEY NOT NULL,
	`playlist_id` integer NOT NULL,
	`track_id` integer NOT NULL,
	`order` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `playlist_tracks_temp` SELECT * FROM `playlist_tracks`;
--> statement-breakpoint
CREATE TABLE `tracks_new` (
	`id` integer PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`title` text,
	`release_id` integer,
	`order` integer NOT NULL,
	`duration` integer NOT NULL,
	`favorite` integer NOT NULL,
	`image_id` integer,
	FOREIGN KEY (`release_id`) REFERENCES `releases`(`id`) ON DELETE set null,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `tracks_new` SELECT * FROM `tracks`;
--> statement-breakpoint
DROP TABLE `tracks`;
--> statement-breakpoint
ALTER TABLE `tracks_new` RENAME TO `tracks`;
--> statement-breakpoint
INSERT INTO `track_artists` SELECT * FROM `track_artists_temp`;
--> statement-breakpoint
DROP TABLE `track_artists_temp`;
--> statement-breakpoint
INSERT INTO `track_tags` SELECT * FROM `track_tags_temp`;
--> statement-breakpoint
DROP TABLE `track_tags_temp`;
--> statement-breakpoint
INSERT INTO `playlist_tracks` SELECT * FROM `playlist_tracks_temp`;
--> statement-breakpoint
DROP TABLE `playlist_tracks_temp`;

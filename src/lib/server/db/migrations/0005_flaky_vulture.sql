ALTER TABLE downloads ADD `ref` integer NOT NULL;
ALTER TABLE downloads DROP COLUMN `path`;
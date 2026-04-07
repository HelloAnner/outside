CREATE TABLE `articles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`sequence` integer NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`translation` text DEFAULT '' NOT NULL,
	`difficulty` real NOT NULL,
	`word_count` integer DEFAULT 0 NOT NULL,
	`review_word_ids` text DEFAULT '[]' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`topic_id`) REFERENCES `topics`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_articles_topic_seq` ON `articles` (`topic_id`,`sequence`);--> statement-breakpoint
CREATE INDEX `idx_articles_user_created` ON `articles` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `topics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`content_format` text DEFAULT 'essay' NOT NULL,
	`is_builtin` integer DEFAULT false NOT NULL,
	`prompt_template` text DEFAULT '' NOT NULL,
	`reference_words` text DEFAULT '[]' NOT NULL,
	`config` text DEFAULT '{}' NOT NULL,
	`articles_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_topics_user_slug` ON `topics` (`user_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_topics_user` ON `topics` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`global_config` text DEFAULT '{}' NOT NULL,
	`accent` text DEFAULT 'us' NOT NULL,
	`auto_pronounce` integer DEFAULT false NOT NULL,
	`auto_read_on_select` integer DEFAULT true NOT NULL,
	`llm_provider` text DEFAULT 'anthropic' NOT NULL,
	`llm_model` text DEFAULT 'claude-sonnet-4-5' NOT NULL,
	`llm_api_key` text DEFAULT '' NOT NULL,
	`llm_base_url` text DEFAULT '' NOT NULL,
	`tts_service` text DEFAULT 'web-speech-api' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `word_contexts` (
	`id` text PRIMARY KEY NOT NULL,
	`word_id` text NOT NULL,
	`article_id` text NOT NULL,
	`sentence` text NOT NULL,
	`sentence_translation` text DEFAULT '' NOT NULL,
	`is_review` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`word_id`) REFERENCES `words`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_word_contexts_word_article` ON `word_contexts` (`word_id`,`article_id`);--> statement-breakpoint
CREATE INDEX `idx_word_contexts_word` ON `word_contexts` (`word_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_word_contexts_article` ON `word_contexts` (`article_id`);--> statement-breakpoint
CREATE TABLE `words` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`text` text NOT NULL,
	`phonetic` text DEFAULT '' NOT NULL,
	`definition` text DEFAULT '' NOT NULL,
	`pos` text DEFAULT '' NOT NULL,
	`familiarity` text DEFAULT 'unfamiliar' NOT NULL,
	`review_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_words_user_text` ON `words` (`user_id`,`text`);--> statement-breakpoint
CREATE INDEX `idx_words_user_familiarity` ON `words` (`user_id`,`familiarity`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_words_user_review` ON `words` (`user_id`,`familiarity`,`review_count`);
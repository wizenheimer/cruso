CREATE TABLE "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"days" integer[],
	"date" date,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"label" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"calendar_id" varchar(255) NOT NULL,
	"calendar_name" varchar(255),
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"is_primary" boolean DEFAULT false,
	"include_in_availability" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "calendar_connections_user_id_calendar_id_unique" UNIQUE("user_id","calendar_id")
);
--> statement-breakpoint
CREATE TABLE "inbox_data" (
	"id" uuid PRIMARY KEY NOT NULL,
	"exchange_id" uuid NOT NULL,
	"message_id" varchar(500) NOT NULL,
	"previous_message_id" varchar(500),
	"sender" varchar(255) NOT NULL,
	"recipients" jsonb NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"timestamp" timestamp NOT NULL,
	"type" varchar(10) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "inbox_data_id_unique" UNIQUE("id"),
	CONSTRAINT "inbox_data_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"document" text NOT NULL,
	"display_name" varchar(255),
	"nickname" varchar(255),
	"timezone" varchar(100),
	"min_notice_minutes" integer DEFAULT 120,
	"max_days_ahead" integer DEFAULT 60,
	"default_meeting_duration_minutes" integer DEFAULT 30,
	"buffer_before_minutes" integer DEFAULT 0,
	"buffer_after_minutes" integer DEFAULT 0,
	"in_person_buffer_before_minutes" integer DEFAULT 15,
	"in_person_buffer_after_minutes" integer DEFAULT 15,
	"back_to_back_limit_minutes" integer,
	"back_to_back_buffer_minutes" integer,
	"cluster_meetings" boolean DEFAULT false,
	"meeting_naming_convention" text,
	"refinement" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"email" varchar(255) NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_availability_user_days" ON "availability" USING btree ("user_id","days");--> statement-breakpoint
CREATE INDEX "idx_availability_user_date" ON "availability" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_user" ON "calendar_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_inbox_data_exchange_timestamp" ON "inbox_data" USING btree ("exchange_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_inbox_data_message_id" ON "inbox_data" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_inbox_data_previous_message_id" ON "inbox_data" USING btree ("previous_message_id");--> statement-breakpoint
CREATE INDEX "idx_inbox_data_sender" ON "inbox_data" USING btree ("sender");--> statement-breakpoint
CREATE INDEX "idx_inbox_data_type_timestamp" ON "inbox_data" USING btree ("type","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_inbox_data_timestamp" ON "inbox_data" USING btree ("timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_inbox_data_exchange_type_timestamp" ON "inbox_data" USING btree ("exchange_id","type","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_preferences_user_active" ON "preferences" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_user_emails_email" ON "user_emails" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_user_emails_user" ON "user_emails" USING btree ("user_id");
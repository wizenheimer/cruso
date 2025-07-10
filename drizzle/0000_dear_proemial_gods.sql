CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"days" integer[],
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"timezone" varchar(100) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "calendar_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"account_id" varchar(255),
	"google_account_id" varchar(255) NOT NULL,
	"google_email" varchar(255) NOT NULL,
	"calendar_id" varchar(255) NOT NULL,
	"calendar_name" varchar(255),
	"calendar_timezone" varchar(100),
	"last_sync_at" timestamp,
	"sync_status" varchar(50) DEFAULT 'active',
	"error_message" text,
	"is_primary" boolean DEFAULT false,
	"include_in_availability" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "calendar_connections_user_google_account_calendar_unique" UNIQUE("user_id","google_account_id","calendar_id")
);
--> statement-breakpoint
CREATE TABLE "exchange_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange_id" uuid NOT NULL,
	"user_id" text,
	"exchange_type" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exchange_owners_id_unique" UNIQUE("id"),
	CONSTRAINT "unique_exchange_user" UNIQUE("exchange_id","user_id")
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
	"user_id" text,
	"document" text NOT NULL,
	"display_name" varchar(255),
	"nickname" varchar(255),
	"signature" text,
	"timezone" varchar(100),
	"min_notice_minutes" integer DEFAULT 120,
	"max_days_ahead" integer DEFAULT 60,
	"default_meeting_duration_minutes" integer DEFAULT 30,
	"virtual_buffer_minutes" integer DEFAULT 0,
	"in_person_buffer_minutes" integer DEFAULT 15,
	"back_to_back_buffer_minutes" integer DEFAULT 0,
	"flight_buffer_minutes" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"email" varchar(255) NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_emails_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "calendar_connections" ADD CONSTRAINT "calendar_connections_account_id_account_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exchange_owners" ADD CONSTRAINT "exchange_owners_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_emails" ADD CONSTRAINT "user_emails_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_availability_user_days" ON "availability" USING btree ("user_id","days");--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_user" ON "calendar_connections" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_account" ON "calendar_connections" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_google_account" ON "calendar_connections" USING btree ("google_account_id");--> statement-breakpoint
CREATE INDEX "idx_calendar_connections_sync_status" ON "calendar_connections" USING btree ("sync_status");--> statement-breakpoint
CREATE INDEX "idx_exchange_owners_exchange_id" ON "exchange_owners" USING btree ("exchange_id");--> statement-breakpoint
CREATE INDEX "idx_exchange_owners_user_id" ON "exchange_owners" USING btree ("user_id");--> statement-breakpoint
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
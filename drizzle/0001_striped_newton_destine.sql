CREATE TABLE "exchange_owners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exchange_id" uuid NOT NULL,
	"user_id" integer NOT NULL,
	"exchange_type" varchar(20),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "exchange_owners_id_unique" UNIQUE("id"),
	CONSTRAINT "unique_exchange_user" UNIQUE("exchange_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "exchange_owners" ADD CONSTRAINT "exchange_owners_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_exchange_owners_exchange_id" ON "exchange_owners" USING btree ("exchange_id");--> statement-breakpoint
CREATE INDEX "idx_exchange_owners_user_id" ON "exchange_owners" USING btree ("user_id");
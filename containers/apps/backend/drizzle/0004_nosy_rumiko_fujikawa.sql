CREATE TYPE "public"."friendship_status" AS ENUM('PENDING', 'ACCEPTED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."face_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TABLE "friendships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"addressee_id" uuid NOT NULL,
	"status" "friendship_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_requester_addressee" UNIQUE("requester_id","addressee_id")
);
--> statement-breakpoint
CREATE TABLE "faces" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"emoji" text,
	"description" text,
	"image_id" uuid,
	"visibility" "face_visibility" DEFAULT 'public' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seed_images" (
	"seed_id" uuid NOT NULL,
	"image_id" uuid NOT NULL,
	"display_order" integer NOT NULL,
	CONSTRAINT "seed_images_seed_id_image_id_pk" PRIMARY KEY("seed_id","image_id")
);
--> statement-breakpoint
CREATE TABLE "seeds" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"face_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addressee_id_users_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faces" ADD CONSTRAINT "faces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faces" ADD CONSTRAINT "faces_image_id_file_metadata_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."file_metadata"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_images" ADD CONSTRAINT "seed_images_seed_id_seeds_id_fk" FOREIGN KEY ("seed_id") REFERENCES "public"."seeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seed_images" ADD CONSTRAINT "seed_images_image_id_file_metadata_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."file_metadata"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_face_id_faces_id_fk" FOREIGN KEY ("face_id") REFERENCES "public"."faces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_friendships_requester_status" ON "friendships" USING btree ("requester_id","status");--> statement-breakpoint
CREATE INDEX "idx_friendships_addressee_status" ON "friendships" USING btree ("addressee_id","status");--> statement-breakpoint
CREATE INDEX "idx_faces_user_id" ON "faces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seed_images_image_id" ON "seed_images" USING btree ("image_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_seed_images_seed_id_order" ON "seed_images" USING btree ("seed_id","display_order");--> statement-breakpoint
CREATE INDEX "idx_seeds_user_id" ON "seeds" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_seeds_face_id" ON "seeds" USING btree ("face_id");
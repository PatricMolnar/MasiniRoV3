using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MasiniRo.Server.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "CarListings",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "CarListings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ProfilePicturePath",
                table: "AppUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CarListings_UserId",
                table: "CarListings",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_CarListings_AppUsers_UserId",
                table: "CarListings",
                column: "UserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CarListings_AppUsers_UserId",
                table: "CarListings");

            migrationBuilder.DropIndex(
                name: "IX_CarListings_UserId",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "ProfilePicturePath",
                table: "AppUsers");
        }
    }
}

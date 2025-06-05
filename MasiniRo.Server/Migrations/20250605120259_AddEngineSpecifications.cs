using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MasiniRo.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddEngineSpecifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CubicCapacity",
                table: "CarListings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "EngineType",
                table: "CarListings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Horsepower",
                table: "CarListings",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CubicCapacity",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "EngineType",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "Horsepower",
                table: "CarListings");
        }
    }
}

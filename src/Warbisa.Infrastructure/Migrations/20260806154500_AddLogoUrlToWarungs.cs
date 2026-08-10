using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Warbisa.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLogoUrlToWarungs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "warungs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "warungs");
        }
    }
}

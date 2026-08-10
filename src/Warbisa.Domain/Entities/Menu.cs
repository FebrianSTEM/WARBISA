namespace Warbisa.Domain.Entities;

public class Menu
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public string? Icon { get; set; }
    public int OrderNo { get; set; } = 0;
    public int? ParentId { get; set; }

    public Menu? Parent { get; set; }
    public ICollection<Menu> SubMenus { get; set; } = new List<Menu>();
    public ICollection<RoleMenuPermission> RoleMenuPermissions { get; set; } = new List<RoleMenuPermission>();
}

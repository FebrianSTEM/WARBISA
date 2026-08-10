namespace Warbisa.Domain.Entities;

public class RoleMenuPermission
{
    public int RoleId { get; set; }
    public int MenuId { get; set; }
    public bool CanRead { get; set; } = true;
    public bool CanCreate { get; set; } = false;
    public bool CanUpdate { get; set; } = false;
    public bool CanDelete { get; set; } = false;

    public Role? Role { get; set; }
    public Menu? Menu { get; set; }
}

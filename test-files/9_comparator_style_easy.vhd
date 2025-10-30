library IEEE;  
use IEEE.STD_LOGIC_1164.all;  
entity comp is  
	port
	(  
		a : in STD_LOGIC_VECTOR(6 downto 0);
		Y : out STD_LOGIC  
	);  
end comp;  
architecture comp of comp is  
begin  
	Y <= not(not(a(6)) or (a(6) and not(a(5)) and not(a(4)) and not(a(3))) or (a(6) and not(a(5)) and not(a(4)) and a(3) and not(a(2)) and not(a(1))));  
end comp; 
library IEEE;
use IEEE.STD_LOGIC_1164.ALL;
use IEEE.NUMERIC_STD.ALL;

entity ram_controller is
port(
    clk      : in  std_logic;
    addr     : in  std_logic_vector(6 downto 0);
    data_in  : in  std_logic_vector(7 downto 0);
    wr_en    : in  std_logic;
    data_out : out std_logic_vector(7 downto 0)
);
end entity ram_controller;

architecture rtl of ram_controller is
  TYPE ram_array_t IS ARRAY (0 TO 127) OF STD_LOGIC_VECTOR(7 DOWNTO 0);
  
  signal ram : ram_array_t := (
    x"55", x"66", x"77", x"67",
    x"99", x"00", x"00", x"11",
    others => x"00"
  );
  
  signal addr_reg : integer range 0 to 127;
  
begin
  process(clk)
begin
    if rising_edge(clk) then
      addr_reg <= to_integer(unsigned(addr));
      if wr_en = '1' then
        ram(to_integer(unsigned(addr))) <= data_in;
      end if;
      if wr_en = '1' and to_integer(unsigned(addr)) = addr_reg then
        data_out <= data_in;
      else
        data_out <= ram(addr_reg);
 end if;
 end if;
end process;
end architecture rtl;
